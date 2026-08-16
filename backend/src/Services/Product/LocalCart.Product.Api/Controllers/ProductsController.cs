using LocalCart.Product.Application.Products;
using LocalCart.Product.Application.Products.Commands.CreateProduct;
using LocalCart.Product.Application.Products.Commands.DeleteProduct;
using LocalCart.Product.Application.Products.Commands.UpdateProduct;
using LocalCart.Product.Application.Products.Queries.GetProductById;
using LocalCart.Product.Application.Products.Queries.GetProducts;
using LocalCart.Product.Application.Products.Queries.GetSellerProductById;
using LocalCart.Product.Application.Products.Queries.GetSellerProducts;
using LocalCart.Product.Domain.Products;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LocalCart.Product.Api.Controllers;

[ApiController]
[Route("api/v1/products")]
[Produces("application/json")]
public sealed class ProductsController(ISender sender) : ControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType<PagedResult<ProductResponse>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<PagedResult<ProductResponse>>> GetProducts(
        [FromQuery] ProductListRequest request,
        CancellationToken cancellationToken) =>
        Ok(await sender.Send(
            new GetProductsQuery(
                request.Search,
                request.CategoryId,
                request.MinPrice,
                request.MaxPrice,
                request.Sort,
                request.Page,
                request.PageSize),
            cancellationToken));

    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    [ProducesResponseType<ProductResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ProductResponse>> GetById(Guid id, CancellationToken cancellationToken) =>
        Ok(await sender.Send(new GetProductByIdQuery(id), cancellationToken));

    [HttpGet("mine")]
    [Authorize(Policy = "SellerOnly")]
    [ProducesResponseType<PagedResult<ProductResponse>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResult<ProductResponse>>> GetMine(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default) =>
        Ok(await sender.Send(new GetSellerProductsQuery(page, pageSize), cancellationToken));

    [HttpGet("mine/{id:guid}")]
    [Authorize(Policy = "SellerOnly")]
    [ProducesResponseType<ProductResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ProductResponse>> GetMineById(
        Guid id,
        CancellationToken cancellationToken) =>
        Ok(await sender.Send(new GetSellerProductByIdQuery(id), cancellationToken));

    [HttpPost]
    [Authorize(Policy = "ProductManager")]
    [ProducesResponseType<ProductResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<ProductResponse>> Create(
        CreateProductRequest request,
        CancellationToken cancellationToken)
    {
        var response = await sender.Send(
            new CreateProductCommand(
                request.CategoryId,
                request.Name,
                request.Slug,
                request.Description,
                request.Price,
                request.Currency,
                request.StockQuantity,
                request.ImageUrl,
                request.Status),
            cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = response.Id }, response);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = "ProductManager")]
    [ProducesResponseType<ProductResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ProductResponse>> Update(
        Guid id,
        UpdateProductRequest request,
        CancellationToken cancellationToken) =>
        Ok(await sender.Send(
            new UpdateProductCommand(
                id,
                request.Version,
                request.CategoryId,
                request.Name,
                request.Slug,
                request.Description,
                request.Price,
                request.Currency,
                request.StockQuantity,
                request.ImageUrl,
                request.Status),
            cancellationToken));

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "ProductManager")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Delete(
        Guid id,
        [FromQuery] Guid version,
        CancellationToken cancellationToken)
    {
        await sender.Send(new DeleteProductCommand(id, version), cancellationToken);
        return NoContent();
    }
}

public sealed record ProductListRequest(
    string? Search = null,
    Guid? CategoryId = null,
    decimal? MinPrice = null,
    decimal? MaxPrice = null,
    ProductSort Sort = ProductSort.Newest,
    int Page = 1,
    int PageSize = 12);

public sealed record CreateProductRequest(
    Guid CategoryId,
    string Name,
    string Slug,
    string Description,
    decimal Price,
    string Currency,
    int StockQuantity,
    string ImageUrl,
    ProductStatus Status = ProductStatus.Draft);

public sealed record UpdateProductRequest(
    Guid Version,
    Guid CategoryId,
    string Name,
    string Slug,
    string Description,
    decimal Price,
    string Currency,
    int StockQuantity,
    string ImageUrl,
    ProductStatus Status);
