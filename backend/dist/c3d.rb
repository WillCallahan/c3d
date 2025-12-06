class C3d < Formula
  desc "A 3D file conversion tool"
  homepage "https://github.com/<YOUR-USERNAME>/c3d"
  url "https://github.com/<YOUR-USERNAME>/c3d/releases/download/v0.1.0/c3d-macos-latest"
  sha256 "<SHA256-OF-THE-EXECUTABLE>"
  version "0.1.0"

  def install
    bin.install "c3d-macos-latest" => "c3d"
  end

  test do
    system "#{bin}/c3d", "--version"
  end
end
