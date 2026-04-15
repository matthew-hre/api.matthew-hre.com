{
  mkShell,
  alejandra,
  bun,
}:
mkShell {
  name = "api.matthew-hre.com";

  packages = [
    bun

    alejandra
  ];
}
