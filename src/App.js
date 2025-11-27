import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Download, Trash2, AlertCircle } from 'lucide-react';

export default function StudyPlanner() {
  const [assignments, setAssignments] = useState([]);
  const [currentAssignment, setCurrentAssignment] = useState({
    name: '',
    deadline: '',
    weight: ''
  });
  const [cookedLevel, setCookedLevel] = useState(null);
  const [schedulePreview, setSchedulePreview] = useState([]);
  const [blockedTimes, setBlockedTimes] = useState([]);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [typedText, setTypedText] = useState('');

  useEffect(() => {
    const text = 'How Cooked Are You?';
    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) {
        setTypedText(text.slice(0, i + 1));
        i++;
      } else {
        clearInterval(timer);
      }
    }, 100);
    return () => clearInterval(timer);
  }, []);

  const addAssignment = () => {
    if (currentAssignment.name && currentAssignment.deadline && currentAssignment.weight) {
      setAssignments([...assignments, { ...currentAssignment, id: Date.now() }]);
      setCurrentAssignment({ name: '', deadline: '', weight: '' });
    }
  };

  const removeAssignment = (id) => {
    setAssignments(assignments.filter(a => a.id !== id));
  };

  const calculateCookedLevel = () => {
    if (assignments.length === 0) return null;

    const now = new Date();
    let totalStress = 0;

    assignments.forEach(assignment => {
      const deadline = new Date(assignment.deadline);
      const daysUntil = (deadline - now) / (1000 * 60 * 60 * 24);
      const weight = parseFloat(assignment.weight);
      
      // Stress calculation: higher weight + closer deadline = more stress
      const stressScore = (weight / Math.max(daysUntil, 0.5)) * 10;
      totalStress += stressScore;
    });

    if (totalStress < 5) return { level: 'Chilling ☕', color: 'bg-green-100 text-green-800', message: "You've got this! Plenty of time to prep." };
    if (totalStress < 15) return { level: 'Slightly Toasted 🍞', color: 'bg-yellow-100 text-yellow-800', message: "Getting warm, but manageable with good planning." };
    if (totalStress < 30) return { level: 'Medium Cooked 🔥', color: 'bg-orange-100 text-orange-800', message: "Time to buckle down and hit the books!" };
    if (totalStress < 50) return { level: 'Well Done 🥵', color: 'bg-red-100 text-red-800', message: "It's crunch time! Consider office hours and study groups." };
    return { level: 'ABSOLUTELY COOKED 💀', color: 'bg-red-200 text-red-900', message: "Emergency mode! Talk to profs about extensions if possible." };
  };

  const handleCalendarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploadedFileName(file.name);

    try {
      const text = await file.text();
      const events = parseICS(text);
      setBlockedTimes(events);
    } catch (error) {
      console.error('Error parsing calendar file:', error);
      alert('Error reading calendar file. Please make sure it\'s a valid .ics file.');
    }
  };

  const parseICS = (icsText) => {
    const events = [];
    const lines = icsText.split(/\r?\n/);
    let currentEvent = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line === 'BEGIN:VEVENT') {
        currentEvent = {};
      } else if (line === 'END:VEVENT' && currentEvent) {
        if (currentEvent.start && currentEvent.end) {
          events.push({
            start: currentEvent.start,
            end: currentEvent.end
          });
        }
        currentEvent = null;
      } else if (currentEvent) {
        if (line.startsWith('DTSTART')) {
          const dateStr = line.split(':')[1];
          currentEvent.start = parseICSDate(dateStr);
        } else if (line.startsWith('DTEND')) {
          const dateStr = line.split(':')[1];
          currentEvent.end = parseICSDate(dateStr);
        }
      }
    }

    return events;
  };

  const parseICSDate = (dateStr) => {
    // Handle both YYYYMMDDTHHMMSSZ and YYYYMMDD formats
    if (dateStr.includes('T')) {
      const year = parseInt(dateStr.substring(0, 4));
      const month = parseInt(dateStr.substring(4, 6)) - 1;
      const day = parseInt(dateStr.substring(6, 8));
      const hour = parseInt(dateStr.substring(9, 11));
      const minute = parseInt(dateStr.substring(11, 13));
      return new Date(Date.UTC(year, month, day, hour, minute));
    } else {
      const year = parseInt(dateStr.substring(0, 4));
      const month = parseInt(dateStr.substring(4, 6)) - 1;
      const day = parseInt(dateStr.substring(6, 8));
      return new Date(year, month, day);
    }
  };

  const generateICS = () => {
    if (assignments.length === 0) return;

    const cooked = calculateCookedLevel();
    setCookedLevel(cooked);

    // Sort assignments by deadline
    const sortedAssignments = [...assignments].sort((a, b) => 
      new Date(a.deadline) - new Date(b.deadline)
    );

    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//UBC Study Planner//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:UBC Study Plan',
      'X-WR-TIMEZONE:America/Vancouver'
    ];

    // Track all scheduled sessions to avoid overlaps
    const scheduledSessions = [];
    const previewEvents = [];

    const isOverlapping = (newStart, newEnd) => {
      // Check against other study sessions
      const sessionOverlap = scheduledSessions.some(session => {
        return (newStart < session.end && newEnd > session.start);
      });

      // Check against blocked times from uploaded calendar
      const blockedOverlap = blockedTimes.some(blocked => {
        return (newStart < blocked.end && newEnd > blocked.start);
      });

      return sessionOverlap || blockedOverlap;
    };

    const findNextAvailableSlot = (preferredStart, duration) => {
      let testStart = new Date(preferredStart);
      let testEnd = new Date(testStart.getTime() + duration);

      // Try the preferred time first
      if (!isOverlapping(testStart, testEnd)) {
        return testStart;
      }

      // If overlap, try different times throughout the day
      const timeslots = [
        { hour: 9, minute: 0 },   // 9 AM
        { hour: 11, minute: 0 },  // 11 AM
        { hour: 14, minute: 0 },  // 2 PM
        { hour: 16, minute: 0 },  // 4 PM
        { hour: 19, minute: 0 },  // 7 PM
      ];

      for (let dayOffset = 0; dayOffset < 60; dayOffset++) {
        for (const slot of timeslots) {
          testStart = new Date(preferredStart);
          testStart.setDate(testStart.getDate() + dayOffset);
          testStart.setHours(slot.hour, slot.minute, 0, 0);
          testEnd = new Date(testStart.getTime() + duration);

          if (!isOverlapping(testStart, testEnd)) {
            return testStart;
          }
        }
      }

      return testStart; // Fallback
    };

    sortedAssignments.forEach(assignment => {
      const deadline = new Date(assignment.deadline);
      const now = new Date();
      const daysUntil = Math.max(1, Math.ceil((deadline - now) / (1000 * 60 * 60 * 24)));
      const weight = parseFloat(assignment.weight);
      
      // Determine study sessions based on weight
      const studySessions = Math.max(2, Math.ceil(weight / 10));
      const daysPerSession = Math.floor(daysUntil / studySessions);
      const sessionDuration = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

      for (let i = 0; i < studySessions; i++) {
        const preferredDate = new Date(now);
        preferredDate.setDate(now.getDate() + (i * daysPerSession));
        preferredDate.setHours(14, 0, 0, 0); // Prefer 2 PM

        const sessionStart = findNextAvailableSlot(preferredDate, sessionDuration);
        const sessionEnd = new Date(sessionStart.getTime() + sessionDuration);

        // Record this session to prevent future overlaps
        scheduledSessions.push({ start: sessionStart, end: sessionEnd });

        // Add to preview
        previewEvents.push({
          type: 'study',
          assignment: assignment.name,
          start: sessionStart,
          end: sessionEnd,
          session: `${i + 1}/${studySessions}`
        });

        const formatDate = (date) => {
          return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        };

        icsContent.push(
          'BEGIN:VEVENT',
          `DTSTART:${formatDate(sessionStart)}`,
          `DTEND:${formatDate(sessionEnd)}`,
          `SUMMARY:Study: ${assignment.name}`,
          `DESCRIPTION:Study session ${i + 1}/${studySessions} for ${assignment.name} (${assignment.weight}% weight)\\nDeadline: ${deadline.toLocaleDateString()}`,
          `UID:${assignment.id}-session-${i}@ubcstudyplanner`,
          'STATUS:CONFIRMED',
          'SEQUENCE:0',
          'END:VEVENT'
        );
      }

      // Add deadline reminder
      const reminderDate = new Date(deadline);
      reminderDate.setHours(23, 59, 0, 0);

      previewEvents.push({
        type: 'deadline',
        assignment: assignment.name,
        start: reminderDate,
        end: reminderDate
      });

      icsContent.push(
        'BEGIN:VEVENT',
        `DTSTART:${reminderDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'}`,
        `DTEND:${reminderDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'}`,
        `SUMMARY:🚨 DUE: ${assignment.name}`,
        `DESCRIPTION:Assignment due! Weight: ${assignment.weight}%`,
        `UID:${assignment.id}-deadline@ubcstudyplanner`,
        'STATUS:CONFIRMED',
        'SEQUENCE:0',
        'END:VEVENT'
      );
    });

    // Sort preview events by start date
    previewEvents.sort((a, b) => a.start - b.start);
    setSchedulePreview(previewEvents);

    icsContent.push('END:VCALENDAR');

    const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ubc-study-plan.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const currentCooked = calculateCookedLevel();

  const getBackgroundColor = () => {
    if (!currentCooked) return 'from-red-100 to-red-200';
    if (currentCooked.level.includes('Chilling')) return 'from-green-100 to-green-200';
    if (currentCooked.level.includes('Slightly Toasted')) return 'from-yellow-100 to-yellow-200';
    if (currentCooked.level.includes('Medium Cooked')) return 'from-orange-200 to-orange-300';
    if (currentCooked.level.includes('Well Done')) return 'from-red-300 to-red-400';
    if (currentCooked.level.includes('ABSOLUTELY COOKED')) return 'from-red-700 to-red-800';
    return 'from-red-100 to-red-200';
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${getBackgroundColor()} p-2 sm:p-6 relative overflow-hidden`}>
      <div className="absolute inset-0 opacity-10 pointer-events-none -z-10">
        {Array.from({length: 100}).map((_, i) => (
          <img
            key={i}
            src="/12-125959_png.png"
            alt="flame"
            className="absolute w-4 h-4 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`
            }}
          />
        ))}
      </div>
      <div className="max-w-7xl mx-auto px-2 sm:px-4">
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-8 lg:p-10">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 mb-6 text-center sm:text-left">
            <img src="/cooked.jpg" alt="Cooked" className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded sm:-mt-2.5" />
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-800">SURVIVING UBC 101:</h1>
              <h2 className="text-3xl sm:text-4xl md:text-6xl lg:text-8xl font-black text-orange-500 tracking-tight">{typedText}<span className="animate-pulse font-thin">|</span></h2>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 mt-12">
            <p className="text-sm text-red-800">
              Add assignments → Get study schedule → Find out how screwed you are 🔥
            </p>
          </div>

          {/* Calendar Upload */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
            <label className="block text-sm font-medium text-orange-900 mb-2">
              📤 Got a calendar? Upload it
            </label>
            <p className="text-xs text-orange-700 mb-3">
              .ics file so we don't schedule over your classes
            </p>
            <input
              type="file"
              accept=".ics"
              onChange={handleCalendarUpload}
              className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-orange-600 file:text-white hover:file:bg-orange-700 cursor-pointer"
            />
            {uploadedFileName && (
              <p className="text-sm text-orange-800 mt-2">✓ {uploadedFileName} uploaded ({blockedTimes.length} events blocked)</p>
            )}
          </div>

          {/* Input Form */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <input
              type="text"
              placeholder="Assignment name"
              className="col-span-1 sm:col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm sm:text-base"
              value={currentAssignment.name}
              onChange={(e) => setCurrentAssignment({...currentAssignment, name: e.target.value})}
            />
            <input
              type="date"
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base"
              value={currentAssignment.deadline}
              onChange={(e) => setCurrentAssignment({...currentAssignment, deadline: e.target.value})}
            />
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Weight %"
                min="0"
                max="100"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm sm:text-base"
                value={currentAssignment.weight}
                onChange={(e) => setCurrentAssignment({...currentAssignment, weight: e.target.value})}
              />
              <button
                onClick={addAssignment}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>

          {/* Assignments List */}
          {assignments.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Your Assignments</h2>
              <div className="space-y-2">
                {assignments.map(assignment => (
                  <div key={assignment.id} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{assignment.name}</p>
                      <p className="text-sm text-gray-600">
                        Due: {new Date(assignment.deadline).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} • Weight: {assignment.weight}%
                      </p>
                    </div>
                    <button
                      onClick={() => removeAssignment(assignment.id)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cooked Level Display */}
          {currentCooked && assignments.length > 0 && (
            <div className={`${currentCooked.color} rounded-lg p-6 mb-6`}>
              <div className="flex items-start gap-3">
                <AlertCircle size={24} />
                <div>
                  <h3 className="text-xl font-bold mb-2">Status: {currentCooked.level}</h3>
                  <p className="text-sm">{currentCooked.message}</p>
                </div>
              </div>
            </div>
          )}

          {/* Generate Button */}
          {assignments.length > 0 && (
            <button
              onClick={generateICS}
              className="w-full bg-orange-600 text-white py-3 sm:py-4 rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center gap-2 font-semibold text-base sm:text-lg"
            >
              <Download size={24} />
              Make My Schedule
            </button>
          )}

          {/* Schedule Preview */}
          {schedulePreview.length > 0 && (
            <div className="mt-6">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800">📅 Your Study Schedule</h2>
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4 max-h-80 sm:max-h-96 overflow-y-auto">
                {schedulePreview.map((event, idx) => (
                  <div key={idx} className={`mb-3 pb-3 ${idx !== schedulePreview.length - 1 ? 'border-b border-gray-200' : ''}`}>
                    {event.type === 'study' ? (
                      <div className="flex items-start gap-3">
                        <div className="bg-red-500 text-white rounded px-2 py-1 text-xs font-semibold mt-1">
                          STUDY
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">{event.assignment}</p>
                          <p className="text-xs sm:text-sm text-gray-600">
                            Session {event.session} • {event.start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at {event.start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} - {event.end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-3">
                        <div className="bg-red-500 text-white rounded px-2 py-1 text-xs font-semibold mt-1">
                          DUE
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">🚨 {event.assignment}</p>
                          <p className="text-xs sm:text-sm text-gray-600">
                            {event.start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} by 11:59 PM
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {assignments.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Calendar size={48} className="mx-auto mb-4 opacity-50" />
              <p>Add your first assignment to get started!</p>
            </div>
          )}
        </div>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Made by students, for students. Import to any calendar app.</p>
          <img src="/cooked.jpg" alt="Cooked" className="w-12 h-12 object-cover rounded mx-auto mt-4" />
        </div>
      </div>
    </div>
  );
}