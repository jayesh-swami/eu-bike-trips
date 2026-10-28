import java.net.URLClassLoader
import java.sql.Driver
import java.util.Properties

plugins {
	java
	id("org.springframework.boot") version "4.1.2"
	id("io.spring.dependency-management") version "1.1.7"
	// Runs the SQL migrations in db/migration manually: ./gradlew flywayMigrate
	// The Spring Boot app itself does not depend on Flyway and never migrates on startup.
	id("org.flywaydb.flyway") version "13.11.1"
}

group = "com.eubiketrips"
version = "0.0.1-SNAPSHOT"

java {
	toolchain {
		languageVersion = JavaLanguageVersion.of(21)
	}
}

repositories {
	mavenCentral()
}

// Classpath used only by the flyway* tasks. H2's version comes from the Spring Boot BOM,
// so the migration tool and the app always read/write the same H2 file format.
val flywayMigration = configurations.create("flywayMigration")

dependencies {
	implementation("org.springframework.boot:spring-boot-h2console")
	implementation("org.springframework.boot:spring-boot-starter-data-jpa")
	implementation("org.springframework.boot:spring-boot-starter-graphql")
	implementation("org.springframework.boot:spring-boot-starter-webmvc")
	runtimeOnly("com.h2database:h2")
	flywayMigration("com.h2database:h2")
	testImplementation("org.springframework.boot:spring-boot-starter-data-jpa-test")
	testImplementation("org.springframework.boot:spring-boot-starter-graphql-test")
	testImplementation("org.springframework.boot:spring-boot-starter-webmvc-test")
	testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}

flyway {
	// Same file the app opens (see application.yml): <repo>/db/trips.mv.db
	url = "jdbc:h2:file:" + file("../db/trips").absolutePath
	user = "sa"
	locations = arrayOf("filesystem:" + file("db/migration").absolutePath)
	// ${dataDir} inside the migrations points at the CSV folder
	placeholders = mapOf<Any, Any>("dataDir" to file("../data_findings/data").absolutePath)
	configurations = arrayOf("flywayMigration")
	// Allows a full reset with ./gradlew flywayClean flywayMigrate
	cleanDisabled = false
}

// The bulk loads leave the H2 file ~25x larger than its data (~8 GB instead of ~300 MB).
// SHUTDOWN COMPACT rewrites it; runs automatically after flywayMigrate.
val compactDb = tasks.register("compactDb") {
	group = "flyway"
	description = "Compacts the H2 database file."
	doLast {
		val urls = flywayMigration.files.map { it.toURI().toURL() }.toTypedArray()
		val driver = URLClassLoader(urls).loadClass("org.h2.Driver")
			.getDeclaredConstructor().newInstance() as Driver
		val props = Properties().apply { setProperty("user", "sa") }
		driver.connect("jdbc:h2:file:" + file("../db/trips").absolutePath, props).use {
			it.createStatement().execute("SHUTDOWN COMPACT")
		}
	}
}
tasks.named("flywayMigrate") { finalizedBy(compactDb) }

tasks.withType<Test> {
	useJUnitPlatform()
}
