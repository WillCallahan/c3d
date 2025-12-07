import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import styled, { ThemeProvider } from 'styled-components';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Moon,
  Sun,
  UploadCloud,
  Sparkles,
  ShieldCheck,
  Download,
  Trash2,
} from 'lucide-react';
import { lightTheme, darkTheme } from './theme';
import { GlobalStyle } from './globalStyles';
import { useDarkMode } from './useDarkMode';

type ChipTone = 'primary' | 'success' | 'danger' | 'warning' | 'muted';

const formatOptions = ['stl', 'step', 'stp', 'obj', '3mf'];

const heroStats = [
  {
    value: '24K+',
    label: 'Conversions completed',
    detail: 'since the last release window',
  },
  {
    value: `${formatOptions.length}`,
    label: 'Core CAD formats',
    detail: 'STEP / STL / OBJ / 3MF',
  },
  {
    value: '<60s',
    label: 'Avg job duration',
    detail: 'powered by AWS Lambda fan-out',
  },
];

const App = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [targetFormat, setTargetFormat] = useState('stl');
  const [conversionStatus, setConversionStatus] = useState<Record<string, string>>({});
  const [downloadUrls, setDownloadUrls] = useState<Record<string, string>>({});
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [theme, toggleTheme] = useDarkMode();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles((prevFiles) => [...prevFiles, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
  });

  const getSourceFormat = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    return extension ?? '';
  };

  const handleBrowseClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    open();
  };

  const handleRemoveFile = (fileName: string) => {
    setFiles((prev) => prev.filter((file) => file.name !== fileName));
    setConversionStatus((prev) => {
      const { [fileName]: _removed, ...rest } = prev;
      return rest;
    });
    setDownloadUrls((prev) => {
      const { [fileName]: _removed, ...rest } = prev;
      return rest;
    });
    setProgress((prev) => {
      const { [fileName]: _removed, ...rest } = prev;
      return rest;
    });
  };

  const handleConvert = async () => {
    if (files.length === 0) {
      alert('Please select files to convert.');
      return;
    }

    for (const file of files) {
      const sourceFormat = getSourceFormat(file.name);
      setConversionStatus((prev) => ({
        ...prev,
        [file.name]: 'Preparing secure upload...',
      }));
      setProgress((prev) => ({ ...prev, [file.name]: 0 }));

      try {
        const uploadUrlResponse = await axios.post('/api/upload-url', {
          fileName: file.name,
        });
        const { uploadUrl } = uploadUrlResponse.data;

        setConversionStatus((prev) => ({
          ...prev,
          [file.name]: 'Uploading to S3...',
        }));
        await axios.put(uploadUrl, file, {
          headers: { 'Content-Type': file.type },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / (progressEvent.total ?? 1)
            );
            setProgress((prev) => ({ ...prev, [file.name]: percentCompleted }));
          },
        });

        setConversionStatus((prev) => ({
          ...prev,
          [file.name]: 'Converting in Lambda...',
        }));
        const convertResponse = await axios.post('/api/convert', {
          fileName: file.name,
          sourceFormat,
          targetFormat,
        });
        const { jobId } = convertResponse.data;

        let status = '';
        while (status !== 'completed' && status !== 'failed') {
          await new Promise((resolve) => setTimeout(resolve, 2000));
          const statusResponse = await axios.get(`/api/status/${jobId}`);
          status = statusResponse.data.status;
          setConversionStatus((prev) => ({
            ...prev,
            [file.name]: `Status: ${status}`,
          }));
        }

        if (status === 'completed') {
          const downloadUrlResponse = await axios.get(
            `/api/download-url/${jobId}`
          );
          setDownloadUrls((prev) => ({
            ...prev,
            [file.name]: downloadUrlResponse.data.downloadUrl,
          }));
          setConversionStatus((prev) => ({
            ...prev,
            [file.name]: 'Completed',
          }));
        } else {
          setConversionStatus((prev) => ({
            ...prev,
            [file.name]: 'Failed',
          }));
        }
      } catch (error) {
        console.error('Conversion failed for file:', file.name, error);
        setConversionStatus((prev) => ({
          ...prev,
          [file.name]: 'Failed',
        }));
      }
    }
  };

  const isActiveStatus = (status: string | undefined) => {
    if (!status) {
      return false;
    }
    const normalized = status.toLowerCase();
    return (
      !normalized.includes('completed') && !normalized.includes('failed')
    );
  };

  const isConverting = Object.values(conversionStatus).some((status) =>
    isActiveStatus(status)
  );

  const handleClear = () => {
    setFiles([]);
    setConversionStatus({});
    setDownloadUrls({});
    setProgress({});
  };

  const themeMode = theme === 'light' ? lightTheme : darkTheme;

  return (
    <ThemeProvider theme={themeMode}>
      <GlobalStyle />
      <GradientPage>
        <Backdrop>
          <GlowOne />
          <GlowTwo />
        </Backdrop>
        <Shell>
          <TopBar>
            <Brand>
              <BrandIcon>
                <Sparkles size={18} />
              </BrandIcon>
              <div>
                <BrandName>c3d Cloud Studio</BrandName>
                <BrandSubtitle>
                  STEP {'<->'} STL {'<->'} OBJ
                </BrandSubtitle>
              </div>
              <BetaPill>Beta</BetaPill>
            </Brand>
            <TopActions>
              <DocsLink
                href="https://github.com/WillCallahan/step_to_stl"
                target="_blank"
                rel="noreferrer"
              >
                Product requirements
              </DocsLink>
              <ThemeToggleButton
                onClick={toggleTheme}
                aria-label="Toggle light or dark mode"
              >
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              </ThemeToggleButton>
            </TopActions>
          </TopBar>

          <Layout>
            <HeroSection
              as={motion.section}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <HeroBadge>
                <span>Phase IV</span>
                Experience refresh inspired by Dribbble
              </HeroBadge>
              <HeroTitle>Launch-grade 3D conversions with a single drop.</HeroTitle>
              <HeroDescription>
                Upload CAD files, select a target, and let our Lambda-backed
                pipeline deliver lightweight meshes with deterministic job
                tracking and shareable download links.
              </HeroDescription>
              <FeatureList>
                <FeatureItem>
                  <FeatureIcon>
                    <ShieldCheck size={18} />
                  </FeatureIcon>
                  Zero-trust uploads over pre-signed S3 URLs
                </FeatureItem>
                <FeatureItem>
                  <FeatureIcon>
                    <Sparkles size={18} />
                  </FeatureIcon>
                  Deterministic job IDs & semantic status updates
                </FeatureItem>
              </FeatureList>
              <StatsRow>
                {heroStats.map((stat) => (
                  <StatCard key={stat.label}>
                    <StatValue>{stat.value}</StatValue>
                    <StatLabel>{stat.label}</StatLabel>
                    <StatDetail>{stat.detail}</StatDetail>
                  </StatCard>
                ))}
              </StatsRow>
            </HeroSection>

            <ConverterPanel
              as={motion.section}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.6 }}
            >
              <PanelHeader>
                <div>
                  <PanelTitle>Conversion workspace</PanelTitle>
                  <PanelSubtitle>
                    Batch files with instant progress tracking and smart retries.
                  </PanelSubtitle>
                </div>
                <PanelBadge>Realtime</PanelBadge>
              </PanelHeader>

              <DropRow>
                <DropzoneCard
                  {...getRootProps()}
                  $isActive={isDragActive}
                >
                  <input {...getInputProps()} />
                  <DropIcon>
                    <UploadCloud size={28} />
                  </DropIcon>
                  <DropTitle>Drag & drop files or browse</DropTitle>
                  <DropHint>
                    Secure uploads & automatic format detection (STEP, STL, OBJ,
                    3MF).
                  </DropHint>
                  <BrowseButton onClick={handleBrowseClick}>
                    Browse files
                  </BrowseButton>
                </DropzoneCard>

                <SideColumn>
                  <AdSpot>
                    <AdBadge>AdSense</AdBadge>
                    <AdHeadline>Reserved ad inventory</AdHeadline>
                    <AdCopy>
                      Inject Google AdSense code via CI/CD secrets to monetize the
                      workspace without impacting UX.
                    </AdCopy>
                  </AdSpot>
                  <SideCard>
                    <SideCardTitle>Serverless ready</SideCardTitle>
                    <SideCardBody>
                      AWS Lambda handles conversions while S3 keeps both uploads
                      and downloads encrypted at rest.
                    </SideCardBody>
                  </SideCard>
                </SideColumn>
              </DropRow>

              <FormatSection>
                <SectionLabel>Target format</SectionLabel>
                <FormatGrid role="radiogroup" aria-label="Select target format">
                  {formatOptions.map((option) => (
                    <FormatPill
                      key={option}
                      role="radio"
                      aria-checked={targetFormat === option}
                      $active={targetFormat === option}
                      onClick={() => setTargetFormat(option)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          setTargetFormat(option);
                        }
                      }}
                    >
                      {option.toUpperCase()}
                    </FormatPill>
                  ))}
                </FormatGrid>
              </FormatSection>

              <ActionsRow>
                <PrimaryButton
                  onClick={handleConvert}
                  disabled={isConverting || files.length === 0}
                >
                  {isConverting ? 'Converting...' : 'Convert files'}
                </PrimaryButton>
                <GhostButton
                  onClick={handleClear}
                  disabled={files.length === 0 || isConverting}
                >
                  Clear queue
                </GhostButton>
              </ActionsRow>
              <HelperText>
                <Sparkles size={16} />
                Jobs stream through API Gateway, and you can poll or subscribe to
                a webhook for enterprise pipelines.
              </HelperText>

              <FileList>
                {files.length === 0 ? (
                  <EmptyState>
                    <EmptyTitle>No files yet</EmptyTitle>
                    <EmptyCopy>
                      Drop STEP, STL, OBJ, or 3MF files to see live progress &
                      download links once ready.
                    </EmptyCopy>
                  </EmptyState>
                ) : (
                  <AnimatePresence initial={false}>
                    {files.map((file, index) => {
                      const status = conversionStatus[file.name];
                      const progressValue = progress[file.name] || 0;
                      const downloadUrl = downloadUrls[file.name];
                      const { tone, label } = getChipDetails(status);
                      const isBusy = isActiveStatus(status);

                      return (
                        <FileCard
                          key={`${file.name}-${index}`}
                          layout
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.25 }}
                        >
                          <FileHeader>
                            <div>
                              <FileName>{file.name}</FileName>
                              <FileMeta>
                                {formatBytes(file.size)} / {getSourceFormat(file.name).toUpperCase() || 'AUTO'}
                              </FileMeta>
                            </div>
                            <StatusChip tone={tone}>{label}</StatusChip>
                          </FileHeader>

                          <ProgressWrapper>
                            <ProgressTrack>
                              <ProgressIndicator style={{ width: `${progressValue}%` }} />
                            </ProgressTrack>
                            <ProgressInfo>
                              <span>{status || 'Waiting to start'}</span>
                              <strong>{progressValue}%</strong>
                            </ProgressInfo>
                          </ProgressWrapper>

                          <FileActions>
                            {downloadUrl ? (
                              <DownloadButton
                                href={downloadUrl}
                                download
                                target="_blank"
                                rel="noreferrer"
                              >
                                <Download size={16} />
                                Download
                              </DownloadButton>
                            ) : (
                              <PlaceholderAction>
                                {isBusy ? 'Processing...' : 'Waiting for conversion'}
                              </PlaceholderAction>
                            )}
                            <FileActionIcon
                              type="button"
                              onClick={() => handleRemoveFile(file.name)}
                              disabled={isBusy}
                              aria-label={`Remove ${file.name}`}
                            >
                              <Trash2 size={16} />
                            </FileActionIcon>
                          </FileActions>
                        </FileCard>
                      );
                    })}
                  </AnimatePresence>
                )}
              </FileList>
            </ConverterPanel>
          </Layout>
        </Shell>
      </GradientPage>
    </ThemeProvider>
  );
};

const formatBytes = (bytes: number) => {
  if (!bytes) {
    return '0 B';
  }
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), sizes.length - 1);
  const value = bytes / 1024 ** i;
  return `${value.toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
};

const getChipDetails = (status?: string): { tone: ChipTone; label: string } => {
  if (!status) {
    return { tone: 'muted', label: 'Ready' };
  }
  const normalized = status.toLowerCase();

  if (normalized.includes('fail')) {
    return { tone: 'danger', label: 'Failed' };
  }
  if (normalized.includes('complete')) {
    return { tone: 'success', label: 'Completed' };
  }
  if (
    normalized.includes('upload') ||
    normalized.includes('convert') ||
    normalized.includes('status')
  ) {
    return { tone: 'primary', label: 'Processing' };
  }
  return { tone: 'primary', label: status };
};

const GradientPage = styled.div`
  min-height: 100vh;
  padding: 2.5rem 1.5rem 3rem;
  position: relative;
  overflow: hidden;
  display: flex;
  justify-content: center;
`;

const Backdrop = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
`;

const GlowOne = styled.div`
  position: absolute;
  width: 520px;
  height: 520px;
  background: ${({ theme }) => theme.glow};
  filter: blur(120px);
  opacity: 0.35;
  top: -160px;
  right: -160px;
  border-radius: 50%;
  animation: float 14s ease-in-out infinite;

  @keyframes float {
    0% {
      transform: translate3d(0, 0, 0);
    }
    50% {
      transform: translate3d(-30px, 25px, 0);
    }
    100% {
      transform: translate3d(0, 0, 0);
    }
  }
`;

const GlowTwo = styled(GlowOne)`
  width: 360px;
  height: 360px;
  left: -140px;
  bottom: 0;
  opacity: 0.25;
`;

const Shell = styled.div`
  width: 100%;
  max-width: 1200px;
  position: relative;
  z-index: 2;
`;

const TopBar = styled.nav`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
`;

const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: 0.85rem;
  font-weight: 600;
`;

const BrandIcon = styled.div`
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: ${({ theme }) => theme.gradient};
  display: grid;
  place-items: center;
  color: #fff;
  box-shadow: ${({ theme }) => theme.cardShadow};
`;

const BrandName = styled.div`
  font-size: 1rem;
  color: ${({ theme }) => theme.heading};
`;

const BrandSubtitle = styled.div`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.muted};
`;

const BetaPill = styled.span`
  padding: 0.2rem 0.65rem;
  border-radius: 999px;
  font-size: 0.75rem;
  background: ${({ theme }) => theme.primarySoft};
  color: ${({ theme }) => theme.primary};
`;

const TopActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const DocsLink = styled.a`
  text-decoration: none;
  font-weight: 600;
  color: ${({ theme }) => theme.heading};
  padding: 0.45rem 0.85rem;
  border-radius: 999px;
  border: 1px solid ${({ theme }) => theme.borderColor};
  background: ${({ theme }) => theme.card};
`;

const ThemeToggleButton = styled.button.attrs({ type: 'button' })`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1px solid ${({ theme }) => theme.borderColor};
  background: ${({ theme }) => theme.card};
  display: grid;
  place-items: center;
  color: ${({ theme }) => theme.heading};
  cursor: pointer;
`;

const Layout = styled.div`
  margin-top: 2.5rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 2rem;
`;

const HeroSection = styled.section`
  background: ${({ theme }) => theme.card};
  border-radius: 28px;
  padding: 2.25rem;
  border: 1px solid ${({ theme }) => theme.borderColor};
  box-shadow: ${({ theme }) => theme.cardShadow};
`;

const HeroBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 0.3rem 0.75rem;
  border-radius: 999px;
  background: ${({ theme }) => theme.cardHighlight};
  color: ${({ theme }) => theme.muted};
`;

const HeroTitle = styled.h1`
  margin: 1.25rem 0 0.75rem;
  font-size: clamp(2rem, 4vw, 3rem);
  line-height: 1.1;
  color: ${({ theme }) => theme.heading};
`;

const HeroDescription = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.muted};
  font-size: 1.05rem;
  line-height: 1.6;
`;

const FeatureList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin: 1.5rem 0;
`;

const FeatureItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 500;
  color: ${({ theme }) => theme.heading};
`;

const FeatureIcon = styled.span`
  width: 34px;
  height: 34px;
  border-radius: 12px;
  background: ${({ theme }) => theme.primarySoft};
  color: ${({ theme }) => theme.primary};
  display: grid;
  place-items: center;
`;

const StatsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
  margin-top: 1.5rem;
`;

const StatCard = styled.div`
  padding: 1rem;
  border-radius: 16px;
  border: 1px solid ${({ theme }) => theme.borderColor};
  background: ${({ theme }) => theme.cardHighlight};
`;

const StatValue = styled.div`
  font-size: 1.9rem;
  font-weight: 700;
  color: ${({ theme }) => theme.heading};
`;

const StatLabel = styled.div`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.muted};
`;

const StatDetail = styled.div`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.muted};
`;

const ConverterPanel = styled.section`
  background: ${({ theme }) => theme.panel};
  border-radius: 32px;
  padding: 2.25rem;
  border: 1px solid ${({ theme }) => theme.borderColor};
  box-shadow: ${({ theme }) => theme.shadow};
`;

const PanelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
`;

const PanelTitle = styled.h2`
  margin: 0;
  font-size: 1.6rem;
  color: ${({ theme }) => theme.heading};
`;

const PanelSubtitle = styled.p`
  margin: 0.3rem 0 0;
  color: ${({ theme }) => theme.muted};
`;

const PanelBadge = styled.span`
  padding: 0.35rem 0.9rem;
  border-radius: 999px;
  font-size: 0.85rem;
  background: ${({ theme }) => theme.primarySoft};
  color: ${({ theme }) => theme.primary};
`;

const DropRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 260px;
  gap: 1.25rem;
  margin-top: 1.5rem;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const DropzoneCard = styled.div<{ $isActive: boolean }>`
  border-radius: 26px;
  border: 1.5px dashed
    ${({ theme, $isActive }) =>
      $isActive ? theme.primary : theme.borderColor};
  background: ${({ theme }) => theme.dropzoneBg};
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  min-height: 260px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.75rem;
  transition: transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.cardShadow};
  }
`;

const DropIcon = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 18px;
  background: ${({ theme }) => theme.primarySoft};
  color: ${({ theme }) => theme.primary};
  display: grid;
  place-items: center;
  margin: 0 auto;
`;

const DropTitle = styled.h3`
  margin: 0.6rem 0 0;
  color: ${({ theme }) => theme.heading};
`;

const DropHint = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.muted};
  font-size: 0.95rem;
`;

const BrowseButton = styled.button.attrs({ type: 'button' })`
  align-self: center;
  border-radius: 999px;
  border: none;
  padding: 0.6rem 1.4rem;
  font-weight: 600;
  background: ${({ theme }) => theme.gradient};
  color: #fff;
  cursor: pointer;
`;

const SideColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const AdSpot = styled.div`
  border-radius: 24px;
  padding: 1.25rem;
  background: ${({ theme }) => theme.adBg};
  color: #f4f6ff;
  border: 1px solid ${({ theme }) => theme.adBorder};
  box-shadow: inset 0 0 40px rgba(0, 0, 0, 0.25);
`;

const AdBadge = styled.span`
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: rgba(255, 255, 255, 0.65);
`;

const AdHeadline = styled.div`
  margin-top: 0.5rem;
  font-weight: 600;
`;

const AdCopy = styled.p`
  margin: 0.35rem 0 0;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.75);
`;

const SideCard = styled.div`
  border-radius: 18px;
  border: 1px solid ${({ theme }) => theme.borderColor};
  padding: 1rem;
  background: ${({ theme }) => theme.card};
`;

const SideCardTitle = styled.div`
  font-weight: 600;
  color: ${({ theme }) => theme.heading};
`;

const SideCardBody = styled.p`
  margin: 0.35rem 0 0;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.muted};
`;

const FormatSection = styled.div`
  margin-top: 1.5rem;
`;

const SectionLabel = styled.div`
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.75rem;
  color: ${({ theme }) => theme.muted};
  margin-bottom: 0.75rem;
`;

const FormatGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
`;

const FormatPill = styled.button.attrs({ type: 'button' })<{ $active: boolean }>`
  border-radius: 999px;
  padding: 0.55rem 1.3rem;
  font-weight: 600;
  border: 1px solid
    ${({ theme, $active }) => ($active ? theme.primary : theme.borderColor)};
  color: ${({ theme, $active }) =>
    $active ? '#fff' : theme.heading};
  background: ${({ theme, $active }) =>
    $active ? theme.gradient : theme.card};
  cursor: pointer;
`;

const ActionsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 1.5rem;
`;

const PrimaryButton = styled.button.attrs({ type: 'button' })`
  flex: 1;
  min-width: 180px;
  border-radius: 14px;
  padding: 0.85rem 1.5rem;
  border: none;
  font-weight: 600;
  background: ${({ theme }) => theme.gradient};
  color: #fff;
  cursor: pointer;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const GhostButton = styled(PrimaryButton)`
  flex: 0 0 auto;
  min-width: auto;
  background: ${({ theme }) => theme.card};
  color: ${({ theme }) => theme.heading};
  border: 1px solid ${({ theme }) => theme.borderColor};
`;

const HelperText = styled.p`
  margin: 0.75rem 0 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.muted};
`;

const FileList = styled.div`
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const EmptyState = styled.div`
  padding: 2rem;
  border-radius: 24px;
  border: 1px dashed ${({ theme }) => theme.borderColor};
  text-align: center;
  color: ${({ theme }) => theme.muted};
`;

const EmptyTitle = styled.h3`
  margin: 0;
  color: ${({ theme }) => theme.heading};
`;

const EmptyCopy = styled.p`
  margin: 0.4rem 0 0;
`;

const FileCard = styled(motion.div)`
  border-radius: 22px;
  border: 1px solid ${({ theme }) => theme.borderColor};
  background: ${({ theme }) => theme.card};
  padding: 1.25rem;
  box-shadow: ${({ theme }) => theme.cardShadow};
`;

const FileHeader = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
`;

const FileName = styled.div`
  font-weight: 600;
  color: ${({ theme }) => theme.heading};
`;

const FileMeta = styled.div`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.muted};
`;

const ProgressWrapper = styled.div`
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ProgressTrack = styled.div`
  height: 8px;
  border-radius: 999px;
  background: ${({ theme }) => theme.cardHighlight};
  overflow: hidden;
`;

const ProgressIndicator = styled.div`
  height: 100%;
  background: ${({ theme }) => theme.gradient};
`;

const ProgressInfo = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.muted};

  strong {
    color: ${({ theme }) => theme.heading};
  }
`;

const StatusChip = styled.span<{ tone: ChipTone }>`
  padding: 0.2rem 0.75rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
  background: ${({ tone }) =>
    ({
      success: 'rgba(74, 210, 149, 0.2)',
      danger: 'rgba(240, 93, 94, 0.18)',
      warning: 'rgba(255, 197, 85, 0.24)',
      primary: 'rgba(91, 108, 255, 0.15)',
      muted: 'rgba(96, 104, 128, 0.15)',
    }[tone])};
  color: ${({ theme, tone }) =>
    ({
      success: theme.success,
      danger: theme.danger,
      warning: theme.warning,
      primary: theme.primary,
      muted: theme.muted,
    }[tone])};
`;

const FileActions = styled.div`
  margin-top: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const DownloadButton = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 1rem;
  border-radius: 999px;
  text-decoration: none;
  font-weight: 600;
  background: ${({ theme }) => theme.primarySoft};
  color: ${({ theme }) => theme.primary};
`;

const PlaceholderAction = styled.span`
  color: ${({ theme }) => theme.muted};
  font-size: 0.85rem;
`;

const FileActionIcon = styled.button.attrs({ type: 'button' })`
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 1px solid ${({ theme }) => theme.borderColor};
  background: ${({ theme }) => theme.card};
  display: grid;
  place-items: center;
  color: ${({ theme }) => theme.muted};
  cursor: pointer;

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

export default App;
