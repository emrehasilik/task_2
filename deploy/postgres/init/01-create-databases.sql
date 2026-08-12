SELECT 'CREATE DATABASE localcart_auth'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'localcart_auth')\gexec

SELECT 'CREATE DATABASE localcart_products'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'localcart_products')\gexec
