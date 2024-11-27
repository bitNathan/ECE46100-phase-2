USE registry;

CREATE TABLE packages (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    package_name VARCHAR(100) NOT NULL,
    package_version VARCHAR(20) NOT NULL,
    content LONGBLOB,
    url VARCHAR(255),
    js_program TEXT,
    debloat BOOLEAN
);
