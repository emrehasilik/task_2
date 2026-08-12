using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LocalCart.Product.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddTrigramSearchIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterDatabase()
                .Annotation("Npgsql:PostgresExtension:pg_trgm", ",,");

            migrationBuilder.CreateIndex(
                name: "ix_products_description_trgm",
                schema: "catalog",
                table: "products",
                column: "description")
                .Annotation("Npgsql:IndexMethod", "gin")
                .Annotation("Npgsql:IndexOperators", new[] { "gin_trgm_ops" });

            migrationBuilder.CreateIndex(
                name: "ix_products_name_trgm",
                schema: "catalog",
                table: "products",
                column: "name")
                .Annotation("Npgsql:IndexMethod", "gin")
                .Annotation("Npgsql:IndexOperators", new[] { "gin_trgm_ops" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_products_description_trgm",
                schema: "catalog",
                table: "products");

            migrationBuilder.DropIndex(
                name: "ix_products_name_trgm",
                schema: "catalog",
                table: "products");

            migrationBuilder.AlterDatabase()
                .OldAnnotation("Npgsql:PostgresExtension:pg_trgm", ",,");
        }
    }
}
