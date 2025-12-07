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
  Download,
  Trash2,
  BarChart3,
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
    detail: 'in the last 30 days',
  },
  {
    value: `${formatOptions.length}`,
    label: 'Core CAD formats',
    detail: 'STEP / STL / OBJ / 3MF',
  },
  {
    value: '45s',
    label: 'Avg runtime',
    detail: 'p95 across recent jobs',
  },
];

const usageTrend = [
  { label: 'Mon', value: 42 },
  { label: 'Tue', value: 68 },
  { label: 'Wed', value: 80 },
  { label: 'Thu', value: 52 },
  { label: 'Fri', value: 94 },
  { label: 'Sat', value: 63 },
  { label: 'Sun', value: 76 },
];

const usagePeak = Math.max(...usageTrend.map((point) => point.value));

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
        [file.name]: 'Preparing upload...',
      }));
      setProgress((prev) => ({ ...prev, [file.name]: 0 }));

      try {
        const uploadUrlResponse = await axios.post('/api/upload-url', {
          fileName: file.name,
        });
        const { uploadUrl } = uploadUrlResponse.data;

        setConversionStatus((prev) => ({
          ...prev,
          [file.name]: 'Uploading file...',
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
          [file.name]: 'Converting...',
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
                <BrandSubtitle>STEP {'<->'} STL {'<->'} OBJ</BrandSubtitle>
              </div>
              <BetaPill>Beta</BetaPill>
            </Brand>
            <TopActions>
              <ThemeToggleButton
                onClick={toggleTheme}
                aria-label="Toggle light or dark mode"
              >
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              </ThemeToggleButton>
            </TopActions>
          </TopBar>

          <Layout>
            <Sidebar>
              <HeroSection
                as={motion.section}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <HeroBadge>
                  <span>Live</span>
                  Conversion workspace
                </HeroBadge>
                <HeroTitle>Launch-grade conversions without fuss.</HeroTitle>
                <HeroDescription>
                  Drag, drop, and convert the formats your customers rely on with
                  confident monitoring and delightful UX.
                </HeroDescription>
                <FeatureList>
                  <FeatureItem>Batch-drop multiple CAD formats instantly</FeatureItem>
                  <FeatureItem>Live job history with shareable download links</FeatureItem>
                </FeatureList>

                <UsageCard>
                  <UsageHeader>
                    <UsageTitle>
                      <BarChart3 size={18} /> Usage overview
                    </UsageTitle>
                    <UsageMeta>Last 7 days</UsageMeta>
                  </UsageHeader>
                  <UsageGrid>
                    <UsageTile>
                      <UsageValue>1.2K</UsageValue>
                      <UsageLabel>Jobs</UsageLabel>
                    </UsageTile>
                    <UsageTile>
                      <UsageValue>320</UsageValue>
                      <UsageLabel>Daily peak</UsageLabel>
                    </UsageTile>
                    <UsageTile>
                      <UsageValue>45s</UsageValue>
                      <UsageLabel>Avg runtime</UsageLabel>
                    </UsageTile>
                  </UsageGrid>
                  <UsageChart>
                    {usageTrend.map((point) => (
                      <UsageBarWrapper key={point.label}>
                        <UsageBar
                          style={{
                            height: `${(point.value / usagePeak) * 100}%`,
                          }}
                        />
                        <UsageBarLabel>{point.label}</UsageBarLabel>
                      </UsageBarWrapper>
                    ))}
                  </UsageChart>
                </UsageCard>

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
            </Sidebar>

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
                    Keep everything in one compact board with instant feedback.
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
                  <DropzoneBadge>Upload queue</DropzoneBadge>
                  <DropIcon>
                    <UploadCloud size={28} />
                  </DropIcon>
                  <DropTitle>Drag & drop files or browse</DropTitle>
                  <DropHint>
                    Upload STEP, STL, OBJ, 3MF, and more to queue conversions.
                  </DropHint>
                  <DropEmphasis>
                    Drop anywhere in this card to add files instantly
                  </DropEmphasis>
                  <BrowseButton onClick={handleBrowseClick}>
                    Browse files
                  </BrowseButton>
                </DropzoneCard>

                <SideColumn>
                  <AdSpot>
                    <AdBadge>AdSense</AdBadge>
                    <AdHeadline>Reserve monetization space</AdHeadline>
                    <AdCopy>
                      Inject Google AdSense snippets during CI to activate ads
                      without touching the codebase.
                    </AdCopy>
                  </AdSpot>
                  <SideCard>
                    <SideCardTitle>Usage tips</SideCardTitle>
                    <SideCardBody>
                      Queue batches, monitor status, and share download links once
                      jobs complete.
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
                Keep this tab open to watch progress in real time or copy the
                download link once ready.
              </HelperText>

              {files.length === 0 ? (
                <EmptyState>
                  <EmptyTitle>No files yet</EmptyTitle>
                  <EmptyCopy>
                    Drop STEP, STL, OBJ, or 3MF files to see live progress &
                    download links in this table.
                  </EmptyCopy>
                </EmptyState>
              ) : (
                <FileTableWrapper>
                  <StyledTable>
                    <thead>
                      <tr>
                        <TableHeader>File</TableHeader>
                        <TableHeader>Details</TableHeader>
                        <TableHeader>Progress</TableHeader>
                        <TableHeader>Status</TableHeader>
                        <TableHeader align="right">Actions</TableHeader>
                      </tr>
                    </thead>
                    <tbody>
                      <AnimatePresence initial={false}>
                        {files.map((file, index) => {
                          const status = conversionStatus[file.name];
                          const progressValue = progress[file.name] || 0;
                          const downloadUrl = downloadUrls[file.name];
                          const { tone, label } = getChipDetails(status);
                          const isBusy = isActiveStatus(status);

                          return (
                            <TableRow
                              key={`${file.name}-${index}`}
                              as={motion.tr}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              transition={{ duration: 0.2 }}
                            >
                              <TableCell>
                                <FileName>{file.name}</FileName>
                              </TableCell>
                              <TableCell>
                                <FileMeta>
                                  {formatBytes(file.size)} / {getSourceFormat(file.name).toUpperCase() || 'AUTO'}
                                </FileMeta>
                              </TableCell>
                              <TableCell>
                                <MiniProgress>
                                  <MiniProgressTrack>
                                    <MiniProgressThumb style={{ width: `${progressValue}%` }} />
                                  </MiniProgressTrack>
                                  <small>{progressValue}%</small>
                                </MiniProgress>
                              </TableCell>
                              <TableCell>
                                <StatusChip tone={tone}>{label}</StatusChip>
                              </TableCell>
                              <TableCell align="right">
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
                                    {isBusy ? 'Processing...' : 'Waiting'}
                                  </PlaceholderAction>
                                )}
                                <FileActionIcon
                                  onClick={() => handleRemoveFile(file.name)}
                                  disabled={isBusy}
                                  aria-label={`Remove ${file.name}`}
                                >
                                  <Trash2 size={16} />
                                </FileActionIcon>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </AnimatePresence>
                    </tbody>
                  </StyledTable>
                </FileTableWrapper>
              )}
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
  padding: 2rem 1.25rem 2.5rem;
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
  width: 420px;
  height: 420px;
  background: ${({ theme }) => theme.glow};
  filter: blur(120px);
  opacity: 0.35;
  top: -140px;
  right: -140px;
  border-radius: 50%;
`;

const GlowTwo = styled(GlowOne)`
  width: 320px;
  height: 320px;
  left: -120px;
  bottom: -40px;
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
  margin-top: 2rem;
  display: grid;
  grid-template-columns: minmax(260px, 360px) minmax(0, 1fr);
  gap: 1.5rem;
  align-items: flex-start;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const Sidebar = styled.div`
  position: sticky;
  top: 1rem;
`;

const HeroSection = styled.section`
  background: ${({ theme }) => theme.card};
  border-radius: 24px;
  padding: 1.8rem;
  border: 1px solid ${({ theme }) => theme.borderColor};
  box-shadow: ${({ theme }) => theme.cardShadow};
`;

const HeroBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 0.3rem 0.75rem;
  border-radius: 999px;
  background: ${({ theme }) => theme.cardHighlight};
  color: ${({ theme }) => theme.muted};
`;

const HeroTitle = styled.h1`
  margin: 1rem 0 0.5rem;
  font-size: 1.8rem;
  line-height: 1.2;
  color: ${({ theme }) => theme.heading};
`;

const HeroDescription = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.muted};
  font-size: 0.95rem;
  line-height: 1.5;
`;

const FeatureList = styled.ul`
  padding-left: 1.2rem;
  margin: 1rem 0 1.25rem;
  color: ${({ theme }) => theme.heading};
  font-weight: 500;
`;

const FeatureItem = styled.li`
  margin-bottom: 0.4rem;
`;

const UsageCard = styled.div`
  border-radius: 20px;
  border: 1px solid ${({ theme }) => theme.borderColor};
  padding: 1.2rem;
  background: ${({ theme }) => theme.cardHighlight};
`;

const UsageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: ${({ theme }) => theme.heading};
`;

const UsageTitle = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-weight: 600;
`;

const UsageMeta = styled.span`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.muted};
`;

const UsageGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
  margin: 1rem 0;
`;

const UsageTile = styled.div`
  padding: 0.65rem 0.75rem;
  border-radius: 14px;
  background: ${({ theme }) => theme.card};
  border: 1px solid ${({ theme }) => theme.borderColor};
`;

const UsageValue = styled.div`
  font-size: 1.1rem;
  font-weight: 600;
  color: ${({ theme }) => theme.heading};
`;

const UsageLabel = styled.div`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.muted};
`;

const UsageChart = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 0.8rem;
  height: 130px;
`;

const UsageBarWrapper = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
`;

const UsageBar = styled.div`
  width: 100%;
  border-radius: 8px 8px 2px 2px;
  background: ${({ theme }) => theme.gradient};
`;

const UsageBarLabel = styled.span`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.muted};
`;

const StatsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.8rem;
  margin-top: 1.2rem;
`;

const StatCard = styled.div`
  padding: 0.9rem;
  border-radius: 16px;
  border: 1px solid ${({ theme }) => theme.borderColor};
  background: ${({ theme }) => theme.cardHighlight};
`;

const StatValue = styled.div`
  font-size: 1.6rem;
  font-weight: 700;
  color: ${({ theme }) => theme.heading};
`;

const StatLabel = styled.div`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.muted};
`;

const StatDetail = styled.div`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.muted};
`;

const ConverterPanel = styled.section`
  background: ${({ theme }) => theme.panel};
  border-radius: 24px;
  padding: 1.75rem;
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
  font-size: 1.4rem;
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
  grid-template-columns: minmax(0, 1fr) 230px;
  gap: 1rem;
  margin-top: 1.25rem;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const DropzoneCard = styled.div<{ $isActive: boolean }>`
  border-radius: 22px;
  border: 1.5px dashed
    ${({ theme, $isActive }) =>
      $isActive ? theme.primary : theme.dropzoneBorder};
  background: ${({ theme }) => theme.dropzoneBg};
  padding: 1.8rem 1.4rem;
  text-align: center;
  cursor: pointer;
  min-height: 240px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.65rem;
  position: relative;
  overflow: hidden;
  box-shadow: 0 25px 60px rgba(15, 23, 42, 0.18);

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: ${({ theme }) => theme.dropzoneAccent};
    opacity: ${({ $isActive }) => ($isActive ? 0.85 : 0.55)};
    transition: opacity 0.3s ease;
  }

  & > * {
    position: relative;
    z-index: 1;
  }
`;

const DropzoneBadge = styled.span`
  align-self: center;
  padding: 0.15rem 0.9rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.3);
  color: #fff;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const DropIcon = styled.div`
  width: 54px;
  height: 54px;
  border-radius: 16px;
  background: ${({ theme }) => theme.primarySoft};
  color: ${({ theme }) => theme.primary};
  display: grid;
  place-items: center;
  margin: 0 auto;
`;

const DropTitle = styled.h3`
  margin: 0.5rem 0 0;
  color: ${({ theme }) => theme.heading};
`;

const DropHint = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.muted};
  font-size: 0.9rem;
`;

const DropEmphasis = styled.div`
  font-size: 0.85rem;
  font-weight: 600;
  color: ${({ theme }) => theme.heading};
  background: rgba(255, 255, 255, 0.25);
  border-radius: 999px;
  padding: 0.35rem 0.9rem;
  margin: 0 auto;
`;

const BrowseButton = styled.button.attrs({ type: 'button' })`
  align-self: center;
  border-radius: 999px;
  border: none;
  padding: 0.5rem 1.2rem;
  font-weight: 600;
  background: ${({ theme }) => theme.gradient};
  color: #fff;
  cursor: pointer;
`;

const SideColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const AdSpot = styled.div`
  border-radius: 20px;
  padding: 1rem;
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
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.75);
`;

const SideCard = styled.div`
  border-radius: 16px;
  border: 1px solid ${({ theme }) => theme.borderColor};
  padding: 0.9rem;
  background: ${({ theme }) => theme.card};
`;

const SideCardTitle = styled.div`
  font-weight: 600;
  color: ${({ theme }) => theme.heading};
`;

const SideCardBody = styled.p`
  margin: 0.35rem 0 0;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.muted};
`;

const FormatSection = styled.div`
  margin-top: 1.25rem;
`;

const SectionLabel = styled.div`
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.75rem;
  color: ${({ theme }) => theme.muted};
  margin-bottom: 0.6rem;
`;

const FormatGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
`;

const FormatPill = styled.button.attrs({ type: 'button' })<{ $active: boolean }>`
  border-radius: 999px;
  padding: 0.5rem 1.1rem;
  font-weight: 600;
  font-size: 0.9rem;
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
  gap: 0.75rem;
  margin-top: 1.25rem;
`;

const PrimaryButton = styled.button.attrs({ type: 'button' })`
  flex: 1;
  min-width: 160px;
  border-radius: 12px;
  padding: 0.7rem 1.4rem;
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
  font-size: 0.85rem;
  color: ${({ theme }) => theme.muted};
`;

const EmptyState = styled.div`
  margin-top: 1.2rem;
  padding: 1.5rem;
  border-radius: 18px;
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

const FileTableWrapper = styled.div`
  margin-top: 1.2rem;
  border: 1px solid ${({ theme }) => theme.borderColor};
  border-radius: 16px;
  overflow: hidden;
  background: ${({ theme }) => theme.card};
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
`;

const TableHeader = styled.th<{ align?: 'left' | 'right' }>`
  text-align: ${({ align }) => align || 'left'};
  padding: 0.85rem 1rem;
  font-weight: 600;
  color: ${({ theme }) => theme.muted};
  border-bottom: 1px solid ${({ theme }) => theme.borderColor};
`;

const TableRow = styled.tr`
  border-bottom: 1px solid ${({ theme }) => theme.borderColor};

  &:last-child {
    border-bottom: none;
  }
`;

const TableCell = styled.td<{ align?: 'left' | 'right' }>`
  padding: 0.75rem 1rem;
  text-align: ${({ align }) => align || 'left'};
  vertical-align: middle;
  color: ${({ theme }) => theme.heading};
`;

const FileName = styled.div`
  font-weight: 600;
  color: ${({ theme }) => theme.heading};
`;

const FileMeta = styled.div`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.muted};
`;

const MiniProgress = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const MiniProgressTrack = styled.div`
  flex: 1;
  height: 6px;
  border-radius: 999px;
  background: ${({ theme }) => theme.cardHighlight};
  overflow: hidden;
`;

const MiniProgressThumb = styled.div`
  height: 100%;
  background: ${({ theme }) => theme.gradient};
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

const DownloadButton = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.9rem;
  border-radius: 999px;
  text-decoration: none;
  font-weight: 600;
  background: ${({ theme }) => theme.primarySoft};
  color: ${({ theme }) => theme.primary};
  margin-right: 0.5rem;
`;

const PlaceholderAction = styled.span`
  color: ${({ theme }) => theme.muted};
  font-size: 0.85rem;
  margin-right: 0.5rem;
`;

const FileActionIcon = styled.button.attrs({ type: 'button' })`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid ${({ theme }) => theme.borderColor};
  background: ${({ theme }) => theme.card};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.muted};
  cursor: pointer;

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

export default App;
