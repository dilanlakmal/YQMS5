import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import html2pdf from 'html2pdf.js';
import Header from '../components/inspection/Header';
import ViewToggle from '../components/inspection/ViewToggle';
import DefectsList from '../components/inspection/DefectsList';
import Summary from '../components/inspection/Summary';
import PlayPauseButton from '../components/inspection/PlayPauseButton';
import { defectsList } from '../constants/defects';

function Inspection({ savedState, onStateChange, onLogEntry, onStartTime, onSubmit }) {
  const navigate = useNavigate();
  const [view, setView] = useState(savedState?.view || 'list');
  const [language, setLanguage] = useState(savedState?.language || 'english');
  const [defects, setDefects] = useState(savedState?.defects || {});
  const [currentDefectCount, setCurrentDefectCount] = useState(savedState?.currentDefectCount || {});
  const [checkedQuantity, setCheckedQuantity] = useState(savedState?.checkedQuantity || 0);
  const [goodOutput, setGoodOutput] = useState(savedState?.goodOutput || 0);
  const [defectPieces, setDefectPieces] = useState(savedState?.defectPieces || 0);
  const [isPlaying, setIsPlaying] = useState(savedState?.isPlaying || false);
  const [timer, setTimer] = useState(savedState?.timer || 0);
  const [hasDefectSelected, setHasDefectSelected] = useState(savedState?.hasDefectSelected || false);
  const [lastActionTime, setLastActionTime] = useState(null);

  useEffect(() => {
    if (!savedState?.inspectionData) {
      navigate('/details');
    }
  }, [savedState, navigate]);

  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    if (!isPlaying) {
      const time = new Date();
      onStartTime?.(time);
      setLastActionTime(time);
    }
    setIsPlaying(!isPlaying);
  };

  const handlePass = () => {
    if (!isPlaying || hasDefectSelected) return;
    
    const currentTime = new Date();
    setCheckedQuantity(prev => prev + 1);
    setGoodOutput(prev => prev + 1);
    
    onLogEntry?.({
      type: 'pass',
      garmentNo: checkedQuantity + 1,
      status: 'Pass',
      timestamp: currentTime.getTime(),
      defectDetails: []
    });

    setLastActionTime(currentTime);
  };

  const handleReject = () => {
    if (!isPlaying || !Object.values(currentDefectCount).some(count => count > 0)) return;
    
    const currentTime = new Date();
    setCheckedQuantity(prev => prev + 1);
    setDefectPieces(prev => prev + 1);
    
    // Update total defects
    Object.entries(currentDefectCount).forEach(([index, count]) => {
      if (count > 0) {
        setDefects(prev => ({
          ...prev,
          [index]: (prev[index] || 0) + count
        }));
      }
    });

    const currentDefects = Object.entries(currentDefectCount)
      .filter(([_, count]) => count > 0)
      .map(([index, count]) => ({
        name: defectsList[language][index],
        count,
        timestamp: currentTime.getTime()
      }));

    onLogEntry?.({
      type: 'reject',
      garmentNo: checkedQuantity + 1,
      status: 'Reject',
      defectDetails: currentDefects,
      timestamp: currentTime.getTime()
    });

    setLastActionTime(currentTime);
    setCurrentDefectCount({});
    setHasDefectSelected(false);
  };

  const handleSubmit = async () => {
    try {
      const element = document.createElement('div');
      element.innerHTML = `
        <h1 style="text-align: center; margin-bottom: 20px;">Inspection Report</h1>
        <div class="inspection-data">
          <h2>Inspection Details</h2>
          ${document.querySelector('.inspection-content')?.innerHTML || ''}
        </div>
        <div class="summary-data">
          <h2>Summary</h2>
          ${document.querySelector('.summary-content')?.innerHTML || ''}
        </div>
        <div class="logs-data">
          <h2>Inspection Logs</h2>
          ${document.querySelector('.logs-content')?.innerHTML || ''}
        </div>
      `;

      const opt = {
        margin: 1,
        filename: 'inspection-report.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      };

      await html2pdf().set(opt).from(element).save();
      onSubmit();
      navigate('/details');
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="inspection-content">
        <div className="fixed top-16 left-0 right-0 bg-white shadow-md z-40">
          <div className="max-w-7xl mx-auto px-4 py-2">
            <Header inspectionData={savedState?.inspectionData} />
          </div>
        </div>

        <div className="fixed top-32 left-0 right-0 bg-white shadow-md z-30">
          <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <ViewToggle
                view={view}
                onViewChange={setView}
                onLanguageChange={setLanguage}
              />
              <PlayPauseButton
                isPlaying={isPlaying}
                onToggle={handlePlayPause}
                timer={formatTime(timer)}
              />
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 pt-40 pb-32">
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-2">
              <button
                onClick={handlePass}
                disabled={!isPlaying || hasDefectSelected}
                className={`w-full py-2 rounded font-medium ${
                  isPlaying && !hasDefectSelected ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                }`}
              >
                Pass
              </button>
            </div>
            <div className="col-span-8">
              <DefectsList
                view={view}
                language={language}
                defects={defects}
                currentDefectCount={currentDefectCount}
                onDefectUpdate={(index, value) => {
                  setDefects(prev => ({ ...prev, [index]: value }));
                  setHasDefectSelected(true);
                }}
                onCurrentDefectUpdate={(index, value) => {
                  setCurrentDefectCount(prev => ({ ...prev, [index]: value }));
                  setHasDefectSelected(true);
                }}
                onLogEntry={onLogEntry}
                isPlaying={isPlaying}
                onDefectSelect={setHasDefectSelected}
              />
            </div>
            <div className="col-span-2">
              <button
                onClick={handleReject}
                disabled={!isPlaying || !Object.values(currentDefectCount).some(count => count > 0)}
                className={`w-full py-2 rounded font-medium ${
                  isPlaying && Object.values(currentDefectCount).some(count => count > 0)
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white shadow-md z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="summary-content">
            <Summary
              defects={defects}
              checkedQuantity={checkedQuantity}
              goodOutput={goodOutput}
              defectPieces={defectPieces}
            />
          </div>
          <div className="flex justify-end mt-4">
            <button
              onClick={handleSubmit}
              className="px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Inspection;
