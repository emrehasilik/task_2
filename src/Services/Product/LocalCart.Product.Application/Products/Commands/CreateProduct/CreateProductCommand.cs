using FluentValidation;
using LocalCart.Product.Application.Abstractions.Caching;
using LocalCart.Product.Application.Abstractions.Identity;
using LocalCart.Product.Application.Abstractions.Persistence;
using LocalCart.Product.Application.Abstractions.Time;
using LocalCart.Product.Application.Common.Exceptions;
using LocalCart.Product.Domain.Products;
using MediatR;
using ProductEntity = LocalCart.Product.Domain.Products.Product;

namespace LocalCart.Product.Application.Products.Commands.CreateProduct;

public sealed record CreateProductCommand(
    Guid CategoryId,
    string Name,
    string Slug,
    string Description,
    decimal Price,
    string Currency,
    int StockQuantity,
    string ImageUrl,
    ProductStatus Status) : IRequest<ProductResponse>;

public sealed class CreateProductCommandValidator : AbstractValidator<CreateProductCommand>
{
    public CreateProductCommandValidator()
    {
        RuleFor(command => command.CategoryId).NotEmpty();
        RuleFor(command => command.Name).NotEmpty().MaximumLength(160);
        RuleFor(command => command.Slug).NotEmpty().MaximumLength(180).Matches("^[a-z0-9]+(?:-[a-z0-9]+)*$");
        RuleFor(command => command.Description).NotEmpty().MaximumLength(4000);
        RuleFor(command => command.Price).GreaterThan(0).LessThanOrEqualTo(10_000_000);
        RuleFor(command => command.Currency).NotEmpty().Length(3).Matches("^[A-Za-z]{3}$");
        RuleFor(command => command.StockQuantity).GreaterThanOrEqualTo(0).LessThanOrEqualTo(1_000_000);
        RuleFor(command => command.ImageUrl)
            .NotEmpty()
            .MaximumLength(2048)
            .Must(value => Uri.TryCreate(value, UriKind.Absolute, out _));
        RuleFor(command => command.Status).IsInEnum().NotEqual(ProductStatus.Archived);
    }
}

public sealed class CreateProductCommandHandler(
    IProductWriteRepository products,
    IUnitOfWork unitOfWork,
    ICacheService cache,
    ICurrentUser currentUser,
    IDateTimeProvider clock) : IRequestHandler<CreateProductCommand, ProductResponse>
{
    public async Task<ProductResponse> Handle(CreateProductCommand request, CancellationToken cancellationToken)
    {
        ProductAuthorization.EnsureCanCreate(currentUser);
        var categoryName = await products.GetCategoryNameAsync(request.CategoryId, cancellationToken).ConfigureAwait(false);
        if (categoryName is null)
        {
            throw new NotFoundException("Category was not found.");
        }

        var normalizedSlug = request.Slug.Trim().ToLowerInvariant();
        if (await products.SlugExistsAsync(normalizedSlug, null, cancellationToken).ConfigureAwait(false))
        {
            throw new ConflictException("A product with this slug already exists.");
        }

        var product = ProductEntity.Create(
            currentUser.UserId,
            request.CategoryId,
            request.Name,
            normalizedSlug,
            request.Description,
            request.Price,
            request.Currency,
            request.StockQuantity,
            request.ImageUrl,
            request.Status,
            clock.UtcNow);
        await products.AddAsync(product, cancellationToken).ConfigureAwait(false);
        await unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        await cache.IncrementVersionAsync(ProductCacheKeys.ListRegion, cancellationToken).ConfigureAwait(false);
        return product.ToResponse(categoryName);
    }
}
