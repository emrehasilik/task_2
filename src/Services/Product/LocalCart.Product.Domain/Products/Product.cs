using LocalCart.Product.Domain.Categories;
using LocalCart.Product.Domain.Common;

namespace LocalCart.Product.Domain.Products;

public sealed class Product : Entity
{
    private Product()
    {
    }

    private Product(
        Guid sellerId,
        Guid categoryId,
        string name,
        string slug,
        string description,
        decimal price,
        string currency,
        int stockQuantity,
        string imageUrl,
        ProductStatus status,
        DateTimeOffset createdAtUtc)
        : base(Guid.NewGuid())
    {
        SellerId = sellerId;
        CategoryId = categoryId;
        Name = name.Trim();
        Slug = slug.Trim().ToLowerInvariant();
        Description = description.Trim();
        Price = price;
        Currency = currency.Trim().ToUpperInvariant();
        StockQuantity = stockQuantity;
        ImageUrl = imageUrl.Trim();
        Status = stockQuantity == 0 && status == ProductStatus.Published ? ProductStatus.OutOfStock : status;
        CreatedAtUtc = createdAtUtc;
        UpdatedAtUtc = createdAtUtc;
        Version = Guid.NewGuid();
    }

    public Guid SellerId { get; private set; }
    public Guid CategoryId { get; private set; }
    public Category Category { get; private set; } = null!;
    public string Name { get; private set; } = string.Empty;
    public string Slug { get; private set; } = string.Empty;
    public string Description { get; private set; } = string.Empty;
    public decimal Price { get; private set; }
    public string Currency { get; private set; } = "TRY";
    public int StockQuantity { get; private set; }
    public string ImageUrl { get; private set; } = string.Empty;
    public ProductStatus Status { get; private set; }
    public bool IsDeleted { get; private set; }
    public DateTimeOffset CreatedAtUtc { get; private set; }
    public DateTimeOffset UpdatedAtUtc { get; private set; }
    public Guid Version { get; private set; }

    public static Product Create(
        Guid sellerId,
        Guid categoryId,
        string name,
        string slug,
        string description,
        decimal price,
        string currency,
        int stockQuantity,
        string imageUrl,
        ProductStatus status,
        DateTimeOffset createdAtUtc) =>
        new(
            sellerId,
            categoryId,
            name,
            slug,
            description,
            price,
            currency,
            stockQuantity,
            imageUrl,
            status,
            createdAtUtc);

    public void Update(
        Guid categoryId,
        string name,
        string slug,
        string description,
        decimal price,
        string currency,
        int stockQuantity,
        string imageUrl,
        ProductStatus status,
        DateTimeOffset utcNow)
    {
        CategoryId = categoryId;
        Name = name.Trim();
        Slug = slug.Trim().ToLowerInvariant();
        Description = description.Trim();
        Price = price;
        Currency = currency.Trim().ToUpperInvariant();
        StockQuantity = stockQuantity;
        ImageUrl = imageUrl.Trim();
        Status = stockQuantity == 0 && status == ProductStatus.Published ? ProductStatus.OutOfStock : status;
        UpdatedAtUtc = utcNow;
        Version = Guid.NewGuid();
    }

    public void SoftDelete(DateTimeOffset utcNow)
    {
        IsDeleted = true;
        Status = ProductStatus.Archived;
        UpdatedAtUtc = utcNow;
        Version = Guid.NewGuid();
    }
}
