/**
 * DevFlow Studio — Semantic Release Configuration
 * Handles automated versioning, changelog generation, and GitHub releases.
 */

module.exports = {
    branches: ["main", { name: "beta", prerelease: true }],
    plugins: [
        "@semantic-release/commit-analyzer",
        "@semantic-release/release-notes-generator",
        [
            "@semantic-release/changelog",
            {
                changelogFile: "CHANGELOG.md",
            },
        ],
        [
            "@semantic-release/npm",
            {
                npmPublish: false,
            },
        ],
        [
            "@semantic-release/github",
            {
                assets: [
                    { path: "apps/desktop/src-tauri/target/release/bundle/msi/*.msi", label: "Windows Installer" },
                    { path: "apps/desktop/src-tauri/target/release/bundle/dmg/*.dmg", label: "macOS Installer" },
                    { path: "apps/desktop/src-tauri/target/release/bundle/deb/*.deb", label: "Linux (Debian) Package" },
                ],
            },
        ],
        [
            "@semantic-release/git",
            {
                assets: ["package.json", "CHANGELOG.md"],
                message: "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}",
            },
        ],
    ],
};
