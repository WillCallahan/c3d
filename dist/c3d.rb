class C3d < Formula
  desc "A 3D file conversion tool"
  homepage "https://github.com/WillCallahan/c3d"
  url "https://github.com/WillCallahan/c3d/archive/refs/tags/v0.1.0.tar.gz"
  sha256 "..."
  license "MIT"

  depends_on "python@3.9"

  def install
    virtualenv_install_with_resources
  end

  test do
    system "#{bin}/c3d", "--version"
  end
end
