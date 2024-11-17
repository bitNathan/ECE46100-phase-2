USE registry;

CREATE TABLE packages (
    id INT UNIQUE PRIMARY KEY,
    package_version VARCHAR(20),
    package_name VARCHAR(100) NOT NULL,
    content TEXT,
    url VARCHAR(255) UNIQUE,
    js_program TEXT,
    debloat boolean
);