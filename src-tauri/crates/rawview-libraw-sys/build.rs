use std::path::PathBuf;

fn main() {
    let libraw_dir = PathBuf::from("vendor/libraw");
    let src_dir = libraw_dir.join("src");

    let mut build = cc::Build::new();
    build
        .cpp(true)
        .warnings(false)
        .include(&libraw_dir)
        .include(libraw_dir.join("libraw"));

    // Set C++ standard
    if build.get_compiler().is_like_msvc() {
        build.flag("/std:c++14");
    } else {
        build.flag("-std=c++11");
    }

    // Platform-specific flags
    if cfg!(target_os = "linux") {
        build.flag("-fPIC");
    }

    // macOS: no special flags needed, clang defaults are fine
    // Windows MSVC: links C++ stdlib automatically

    // Disable OpenMP completely — we use rayon for parallelism.
    // LibRaw checks _OPENMP first, then conditionally defines LIBRAW_USE_OPENMP.
    // We must prevent _OPENMP from being defined AND force LIBRAW_NOTHREADS.
    build.define("LIBRAW_NOTHREADS", None);

    // Ensure OpenMP is not enabled by the compiler
    if !build.get_compiler().is_like_msvc() {
        build.flag("-fno-openmp");
    }

    // Collect all .cpp source files recursively
    let cpp_files = collect_cpp_files(&src_dir);
    for file in &cpp_files {
        build.file(file);
    }

    println!("cargo:warning=Compiling LibRaw 0.21.5 from vendored source ({} source files)", cpp_files.len());

    build.compile("raw");

    // Compile our C helper functions (getters for struct fields not exposed by C API)
    cc::Build::new()
        .file("helpers.c")
        .include(&libraw_dir)
        .include(libraw_dir.join("libraw"))
        .warnings(false)
        .compile("rawview_helpers");

    // Link C++ standard library
    let target_os = std::env::var("CARGO_CFG_TARGET_OS").unwrap_or_default();
    match target_os.as_str() {
        "macos" | "ios" => println!("cargo:rustc-link-lib=c++"),
        "linux" | "freebsd" | "openbsd" | "netbsd" => println!("cargo:rustc-link-lib=stdc++"),
        // Windows MSVC links automatically
        _ => {}
    }

    // Tell cargo to rerun if source changes
    println!("cargo:rerun-if-changed=vendor/libraw/src");
    println!("cargo:rerun-if-changed=vendor/libraw/libraw");
    println!("cargo:rerun-if-changed=helpers.c");
}

/// Recursively collect all .cpp files under a directory.
fn collect_cpp_files(dir: &std::path::Path) -> Vec<PathBuf> {
    let mut files = Vec::new();
    if let Ok(entries) = std::fs::read_dir(dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                files.extend(collect_cpp_files(&path));
            } else if path.extension().is_some_and(|ext| ext == "cpp") {
                files.push(path);
            }
        }
    }
    files
}
