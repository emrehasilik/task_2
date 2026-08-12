using LocalCart.Product.Domain.Common;

namespace LocalCart.Product.Domain.Categories;

public sealed class Category : Entity
{
    private Category()
    {
    }

    private Category(Guid id, string name, string slug, DateTimeOffset createdAtUtc) : base(id)
    {
        Name = name;
        Slug = slug;
        IsActive = true;
        CreatedAtUtc = createdAtUtc;
    }

    public string Name { get; private set; } = string.Empty;
    public string Slug { get; private set; } = string.Empty;
    public bool IsActive { get; private set; }
    public DateTimeOffset CreatedAtUtc { get; private set; }

    public static Category Create(Guid id, string name, string slug, DateTimeOffset createdAtUtc) =>
        new(id, name.Trim(), slug.Trim().ToLowerInvariant(), createdAtUtc);
}
