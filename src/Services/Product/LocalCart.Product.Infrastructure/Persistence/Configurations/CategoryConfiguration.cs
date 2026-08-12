using LocalCart.Product.Domain.Categories;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LocalCart.Product.Infrastructure.Persistence.Configurations;

internal sealed class CategoryConfiguration : IEntityTypeConfiguration<Category>
{
    private static readonly DateTimeOffset SeedDate = new(2026, 1, 1, 0, 0, 0, TimeSpan.Zero);

    public void Configure(EntityTypeBuilder<Category> builder)
    {
        builder.ToTable("categories");
        builder.HasKey(category => category.Id);
        builder.Property(category => category.Id).HasColumnName("id").ValueGeneratedNever();
        builder.Property(category => category.Name).HasColumnName("name").HasMaxLength(120).IsRequired();
        builder.Property(category => category.Slug).HasColumnName("slug").HasMaxLength(140).IsRequired();
        builder.Property(category => category.IsActive).HasColumnName("is_active").IsRequired();
        builder.Property(category => category.CreatedAtUtc).HasColumnName("created_at_utc").IsRequired();
        builder.HasIndex(category => category.Slug).IsUnique().HasDatabaseName("ux_categories_slug");
        builder.HasData(
            Category.Create(Guid.Parse("10000000-0000-0000-0000-000000000001"), "Handmade", "handmade", SeedDate),
            Category.Create(Guid.Parse("10000000-0000-0000-0000-000000000002"), "Local Food", "local-food", SeedDate),
            Category.Create(Guid.Parse("10000000-0000-0000-0000-000000000003"), "Home & Living", "home-living", SeedDate),
            Category.Create(Guid.Parse("10000000-0000-0000-0000-000000000004"), "Accessories", "accessories", SeedDate),
            Category.Create(Guid.Parse("10000000-0000-0000-0000-000000000005"), "Sustainable", "sustainable", SeedDate));
    }
}
