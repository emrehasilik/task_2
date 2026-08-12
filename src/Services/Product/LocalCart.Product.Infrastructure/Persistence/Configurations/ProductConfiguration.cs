using LocalCart.Product.Domain.Products;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ProductEntity = LocalCart.Product.Domain.Products.Product;

namespace LocalCart.Product.Infrastructure.Persistence.Configurations;

internal sealed class ProductConfiguration : IEntityTypeConfiguration<ProductEntity>
{
    public void Configure(EntityTypeBuilder<ProductEntity> builder)
    {
        builder.ToTable("products");
        builder.HasKey(product => product.Id);
        builder.Property(product => product.Id).HasColumnName("id").ValueGeneratedNever();
        builder.Property(product => product.SellerId).HasColumnName("seller_id").IsRequired();
        builder.Property(product => product.CategoryId).HasColumnName("category_id").IsRequired();
        builder.Property(product => product.Name).HasColumnName("name").HasMaxLength(160).IsRequired();
        builder.Property(product => product.Slug).HasColumnName("slug").HasMaxLength(180).IsRequired();
        builder.Property(product => product.Description).HasColumnName("description").HasMaxLength(4000).IsRequired();
        builder.Property(product => product.Price).HasColumnName("price").HasPrecision(18, 2).IsRequired();
        builder.Property(product => product.Currency).HasColumnName("currency").HasMaxLength(3).IsFixedLength().IsRequired();
        builder.Property(product => product.StockQuantity).HasColumnName("stock_quantity").IsRequired();
        builder.Property(product => product.ImageUrl).HasColumnName("image_url").HasMaxLength(2048).IsRequired();
        builder.Property(product => product.Status).HasColumnName("status").HasConversion<string>().HasMaxLength(32).IsRequired();
        builder.Property(product => product.IsDeleted).HasColumnName("is_deleted").IsRequired();
        builder.Property(product => product.CreatedAtUtc).HasColumnName("created_at_utc").IsRequired();
        builder.Property(product => product.UpdatedAtUtc).HasColumnName("updated_at_utc").IsRequired();
        builder.Property(product => product.Version).HasColumnName("version").IsConcurrencyToken().IsRequired();
        builder.HasOne(product => product.Category)
            .WithMany()
            .HasForeignKey(product => product.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasIndex(product => product.Slug).IsUnique().HasDatabaseName("ux_products_slug");
        builder.HasIndex(product => product.Name)
            .HasMethod("gin")
            .HasOperators("gin_trgm_ops")
            .HasDatabaseName("ix_products_name_trgm");
        builder.HasIndex(product => product.Description)
            .HasMethod("gin")
            .HasOperators("gin_trgm_ops")
            .HasDatabaseName("ix_products_description_trgm");
        builder.HasIndex(product => new { product.Status, product.CategoryId, product.Price })
            .HasDatabaseName("ix_products_status_category_price");
        builder.HasIndex(product => new { product.SellerId, product.UpdatedAtUtc })
            .HasDatabaseName("ix_products_seller_updated");
        builder.HasQueryFilter(product => !product.IsDeleted);
    }
}
