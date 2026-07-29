'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  ClipboardList,
  Clock,
  Download,
  Plus,
  Trash2,
  Save,
  CheckCircle,
  FileText,
  AlertTriangle,
  RefreshCw,
  Image as ImageIcon,
  Edit,
  ZoomIn,
  ZoomOut,
  Paperclip,
  X,
  Copy,
  ExternalLink,
  Maximize2
} from 'lucide-react';
import ImageCropper from '@/components/ImageCropper';
import { ACADEMIC_HIERARCHY, getChapters, getConcepts } from '@/lib/academicHierarchy';
import { handleRichPaste, formatCleanText } from '@/lib/pasteUtils';
import MathToolbar from '@/components/MathToolbar';
import MathRenderer from '@/components/MathRenderer';

interface QuestionImage {
  id?: string;
  imageUrl: string;
  type: string;
}

interface Question {
  id: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  detailedSolution: string;
  subject: string;
  topic: string;
  subTopic: string | null;
  concept: string;
  subConcept: string | null;
  classVal: string;
  examType: string;
  difficulty: string;
  status: string;
  reviewFeedback: string | null;
  images: QuestionImage[];
}

interface Task {
  id: string;
  title: string;
  description: string;
  fileUrl: string | null;
  fileName: string | null;
  deadlineDays: number;
  createdAt: string;
}

interface TaskAssignment {
  id: string;
  status: string;
  completedAt: string | null;
  task: Task;
  questions: Question[];
}

function triggerFileDownload(fileUrl: string, fileName: string) {
  if (!fileUrl) return;
  if (fileUrl.startsWith('data:') || fileUrl.startsWith('blob:')) {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName || 'document.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } else {
    const downloadApiUrl = `/api/download?url=${encodeURIComponent(fileUrl)}&filename=${encodeURIComponent(fileName || 'download')}`;
    window.open(downloadApiUrl, '_blank');
  }
}



export default function DailyTasksPage() {
  const [assignments, setAssignments] = useState<TaskAssignment[]>([]);
  const [selectedAsg, setSelectedAsg] = useState<TaskAssignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states for active question
  const [activeQId, setActiveQId] = useState<string | null>(null); // null = creating new
  const [questionText, setQuestionText] = useState('');
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [optionC, setOptionC] = useState('');
  const [optionD, setOptionD] = useState('');
  const [extraOptions, setExtraOptions] = useState<string[]>([]); // Options E, F, G...

  const handleAddExtraOption = () => {
    setExtraOptions((prev) => [...prev, '']);
  };

  const handleRemoveExtraOption = (index: number) => {
    setExtraOptions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateExtraOption = (index: number, value: string) => {
    setExtraOptions((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };
  const [correctAnswer, setCorrectAnswer] = useState('A');
  const [detailedSolution, setDetailedSolution] = useState('');
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [subTopic, setSubTopic] = useState('');
  const [concept, setConcept] = useState('');
  const [subConcept, setSubConcept] = useState('');
  const [classVal, setClassVal] = useState('11th');
  const [examType, setExamType] = useState('JEE');
  const [images, setImages] = useState<QuestionImage[]>([]);

  // Extended classification system state
  const [questionType, setQuestionType] = useState('MCQ');
  const [selectedExams, setSelectedExams] = useState<string[]>(['JEE']);
  
  // Assertion & Reason
  const [assertionText, setAssertionText] = useState('');
  const [reasonText, setReasonText] = useState('');

  // Statement based
  const [statement1, setStatement1] = useState('');
  const [statement2, setStatement2] = useState('');
  const [statement3, setStatement3] = useState('');
  const [statement4, setStatement4] = useState('');

  // Match the following
  const [colA1, setColA1] = useState('');
  const [colA2, setColA2] = useState('');
  const [colA3, setColA3] = useState('');
  const [colA4, setColA4] = useState('');
  const [colBP, setColBP] = useState('');
  const [colBQ, setColBQ] = useState('');
  const [colBR, setColBR] = useState('');
  const [colBS, setColBS] = useState('');

  // Image upload indicators
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  // Extracted images from DOCX
  const [extractedImages, setExtractedImages] = useState<{ name: string; url: string }[]>([]);
  const [extracting, setExtracting] = useState<string | null>(null);

  // References for autofocus and formatting toolbar
  const questionTextareaRef = useRef<HTMLTextAreaElement>(null);
  const solutionTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Cropper states (optional helper)
  const [showCropper, setShowCropper] = useState(false);
  const [cropTargetType, setCropTargetType] = useState('QUESTION');

  // Zoom for PDF/DOCX
  const [pdfZoom, setPdfZoom] = useState(100);

  // Tabbed attachment viewer state
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [pdfEngine, setPdfEngine] = useState<'NATIVE' | 'GOOGLE'>('NATIVE');
  const [fullscreenDoc, setFullscreenDoc] = useState<{ url: string; name: string; isPdf: boolean } | null>(null);

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; mins: number; secs: number } | null>(null);
  const [deadlineAlert, setDeadlineAlert] = useState('');

  // Ref and Zoom for independent Document Viewer viewport & scroll position preservation
  const docViewportRef = useRef<HTMLDivElement>(null);
  const [docScale, setDocScale] = useState<number>(1.0);

  const fetchAssignments = async () => {
    try {
      const res = await fetch('/api/intern/tasks');
      if (!res.ok) throw new Error('Failed to load daily tasks');
      const data = await res.json();
      setAssignments(data);
      if (data.length > 0) {
        const matched = data.find((a: any) => a.id === selectedAsg?.id);
        setSelectedAsg(matched || data[0]);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  // Update countdown timer based on same-day hour cutoff
  useEffect(() => {
    if (!selectedAsg) return;

    const calculateTime = () => {
      const task = selectedAsg.task;
      const createdTime = new Date(task.createdAt);
      
      // deadlineDays represents the same-day hour cutoff (e.g. 23 for 11:59:59 PM)
      const deadlineTime = new Date(createdTime);
      deadlineTime.setHours(task.deadlineDays, 59, 59, 999);
      
      const diff = deadlineTime.getTime() - Date.now();

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, mins: 0, secs: 0 });
        setDeadlineAlert('OVERDUE');
        return;
      }

      const days = Math.floor(diff / (24 * 60 * 60 * 1000));
      const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
      const mins = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
      const secs = Math.floor((diff % (60 * 1000)) / 1000);

      setTimeLeft({ days, hours, mins, secs });

      if (days === 0 && hours < 3) {
        setDeadlineAlert('TODAY (URGENT)');
      } else {
        setDeadlineAlert('TODAY');
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);

    return () => clearInterval(interval);
  }, [selectedAsg]);

  const loadQuestionForEdit = (q: Question) => {
    setActiveQId(q.id);
    setQuestionText(q.questionText);
    setOptionA(q.optionA || '');
    setOptionB(q.optionB || '');
    setOptionC(q.optionC || '');
    setOptionD(q.optionD || '');
    setCorrectAnswer(q.correctAnswer);
    setDetailedSolution(q.detailedSolution);
    setSubject(q.subject);
    setTopic(q.topic);
    setSubTopic(q.subTopic || '');
    setConcept(q.concept);
    setSubConcept(q.subConcept || '');
    setClassVal(q.classVal);
    
    // Parse exams
    const exams = q.examType ? q.examType.split(',').map(s => s.trim()) : [];
    setSelectedExams(exams.length > 0 ? exams : ['JEE']);

    const qType = (q as any).questionType || 'MCQ';
    setQuestionType(qType);

    const extra = (q as any).extraData || {};
    setExtraOptions(extra.additionalOptions || []);
    if (qType === 'ASSERTION_REASON') {
      setAssertionText(extra.assertionText || '');
      setReasonText(extra.reasonText || '');
    } else if (qType === 'STATEMENT_BASED') {
      const st = extra.statements || [];
      setStatement1(st[0] || '');
      setStatement2(st[1] || '');
      setStatement3(st[2] || '');
      setStatement4(st[3] || '');
    } else if (qType === 'MATCH_THE_FOLLOWING') {
      const colA = extra.matchColumnA || [];
      const colB = extra.matchColumnB || [];
      setColA1(colA[0] || '');
      setColA2(colA[1] || '');
      setColA3(colA[2] || '');
      setColA4(colA[3] || '');
      setColBP(colB[0] || '');
      setColBQ(colB[1] || '');
      setColBR(colB[2] || '');
      setColBS(colB[3] || '');
    } else {
      setAssertionText('');
      setReasonText('');
      setStatement1('');
      setStatement2('');
      setStatement3('');
      setStatement4('');
      setColA1('');
      setColA2('');
      setColA3('');
      setColA4('');
      setColBP('');
      setColBQ('');
      setColBR('');
      setColBS('');
    }

    setImages(q.images);

    // Autofocus
    setTimeout(() => questionTextareaRef.current?.focus(), 100);
  };

  const clearForm = () => {
    setActiveQId(null);
    setQuestionText('');
    setOptionA('');
    setOptionB('');
    setOptionC('');
    setOptionD('');
    setExtraOptions([]);
    setCorrectAnswer('A');
    setDetailedSolution('');
    setImages([]);
    
    // Clear custom type fields
    setAssertionText('');
    setReasonText('');
    setStatement1('');
    setStatement2('');
    setStatement3('');
    setStatement4('');
    setColA1('');
    setColA2('');
    setColA3('');
    setColA4('');
    setColBP('');
    setColBQ('');
    setColBR('');
    setColBS('');

    // Do NOT clear subject, class, chapter, concept, selectedExams etc. to optimize bulk entry
    setTimeout(() => questionTextareaRef.current?.focus(), 100);
  };

  const uploadImageDirect = async (fileBlob: Blob, type: string): Promise<string> => {
    setUploadingField(type);
    let lastErrorMsg = '';
    try {
      try {
        const signRes = await fetch('/api/cloudinary/sign?folder=manchester-tech/question-images');
        if (!signRes.ok) {
          const errData = await signRes.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to generate upload signature');
        }
        const signData = await signRes.json();
        const { signature, timestamp, folder, apiKey, cloudName } = signData;

        const cloudinaryData = new FormData();
        cloudinaryData.append('file', fileBlob);
        cloudinaryData.append('api_key', apiKey);
        cloudinaryData.append('timestamp', timestamp.toString());
        cloudinaryData.append('signature', signature);
        cloudinaryData.append('folder', folder);

        const cloudinaryRes = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
          {
            method: 'POST',
            body: cloudinaryData,
          }
        );

        if (cloudinaryRes.ok) {
          const uploadResult = await cloudinaryRes.json();
          return uploadResult.secure_url;
        } else {
          const errResult = await cloudinaryRes.json().catch(() => ({}));
          lastErrorMsg = errResult.error?.message || 'Cloudinary responded with error';
          console.warn('Cloudinary image upload failed, trying local upload:', lastErrorMsg);
        }
      } catch (e: any) {
        lastErrorMsg = e.message || String(e);
        console.warn('Cloudinary image upload threw error, trying local upload:', e);
      }

      // Local upload fallback
      const localFormData = new FormData();
      // Ensure file name is set for blob
      const fileOfBlob = new File([fileBlob], `crop_${Date.now()}.png`, { type: 'image/png' });
      localFormData.append('file', fileOfBlob);
      const localRes = await fetch('/api/upload', {
        method: 'POST',
        body: localFormData,
      });
      if (!localRes.ok) {
        const errData = await localRes.json().catch(() => ({}));
        throw new Error(errData.error || `Upload failed: ${lastErrorMsg || 'Internal server error'}`);
      }
      const localResult = await localRes.json();
      return localResult.secure_url;
    } finally {
      setUploadingField(null);
    }
  };

  const getFieldValue = (type: string): string => {
    if (type === 'QUESTION') return questionText;
    if (type === 'SOLUTION') return detailedSolution;
    if (type === 'OPTION_A') return optionA;
    if (type === 'OPTION_B') return optionB;
    if (type === 'OPTION_C') return optionC;
    if (type === 'OPTION_D') return optionD;
    if (type.startsWith('OPTION_')) {
      const letter = type.replace('OPTION_', '');
      const idx = letter.charCodeAt(0) - 69;
      if (idx >= 0 && idx < extraOptions.length) return extraOptions[idx];
    }
    if (type === 'ASSERTION') return assertionText;
    if (type === 'REASON') return reasonText;
    return '';
  };

  const setFieldValue = (type: string, val: string) => {
    if (type === 'QUESTION') setQuestionText(val);
    else if (type === 'SOLUTION') setDetailedSolution(val);
    else if (type === 'OPTION_A') setOptionA(val);
    else if (type === 'OPTION_B') setOptionB(val);
    else if (type === 'OPTION_C') setOptionC(val);
    else if (type === 'OPTION_D') setOptionD(val);
    else if (type.startsWith('OPTION_')) {
      const letter = type.replace('OPTION_', '');
      const idx = letter.charCodeAt(0) - 69;
      if (idx >= 0 && idx < extraOptions.length) {
        handleUpdateExtraOption(idx, val);
      }
    }
    else if (type === 'ASSERTION') setAssertionText(val);
    else if (type === 'REASON') setReasonText(val);
  };

  const handlePasteImage = async (e: React.ClipboardEvent<HTMLTextAreaElement | HTMLInputElement>, type: string) => {
    const isRichPasted = handleRichPaste(e, getFieldValue(type), (val) => setFieldValue(type, val));
    if (isRichPasted) return;

    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        e.preventDefault();
        const fileBlob = item.getAsFile();
        if (!fileBlob) return;

        try {
          const url = await uploadImageDirect(fileBlob, type);
          setImages((prev) => [...prev, { imageUrl: url, type }]);
          setSuccess(`Image pasted and attached to ${type} successfully!`);
        } catch (err: any) {
          setError(`Paste failed: ${err.message}`);
        }
      }
    }
  };

  const handleUploadImageFile = async (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const fileFile = e.target.files[0];
    try {
      const url = await uploadImageDirect(fileFile, type);
      setImages((prev) => [...prev, { imageUrl: url, type }]);
      setSuccess(`Image uploaded and attached to ${type} successfully!`);
    } catch (err: any) {
      setError(`Upload failed: ${err.message}`);
    }
  };

  const handleSaveQuestion = async () => {
    if (!selectedAsg) return;
    setError('');
    setSuccess('');

    if (!subject || !topic || !concept) {
      setError('Please select Subject, Chapter, and Concept.');
      return;
    }

    if (selectedExams.length === 0) {
      setError('Please select at least one Exam Category.');
      return;
    }

    // Type-specific validations and data structures
    let finalQuestionText = questionText;
    let finalOptionA = optionA;
    let finalOptionB = optionB;
    let finalOptionC = optionC;
    let finalOptionD = optionD;
    let extraData: any = null;

    if (questionType === 'MCQ') {
      if (!questionText || !optionA || !optionB || !optionC || !optionD) {
        setError('Please fill in question text and all four options.');
        return;
      }
    } else if (questionType === 'ASSERTION_REASON') {
      if (!assertionText || !reasonText) {
        setError('Please fill in both Assertion and Reason fields.');
        return;
      }
      finalQuestionText = `Assertion (A): ${assertionText}\nReason (R): ${reasonText}`;
      finalOptionA = "A and R are true and R is the correct explanation.";
      finalOptionB = "A and R are true but R is not the correct explanation.";
      finalOptionC = "A is true but R is false.";
      finalOptionD = "A is false but R is true.";
      extraData = { assertionText, reasonText };
    } else if (questionType === 'STATEMENT_BASED') {
      if (!questionText || !optionA || !optionB || !optionC || !optionD) {
        setError('Please fill in statement question text and all four options.');
        return;
      }
    } else if (questionType === 'TRUE_FALSE') {
      if (!questionText) {
        setError('Please fill in the statement text.');
        return;
      }
      finalOptionA = "True";
      finalOptionB = "False";
      finalOptionC = "";
      finalOptionD = "";
      if (correctAnswer !== 'A' && correctAnswer !== 'B') {
        setError('For True/False, the correct answer must be A (True) or B (False).');
        return;
      }
    } else if (questionType === 'MATCH_THE_FOLLOWING') {
      if (!colA1 || !colA2 || !colBP || !colBQ) {
        setError('Please fill in at least two items in Column A and Column B.');
        return;
      }
      if (!optionA || !optionB || !optionC || !optionD) {
        setError('Please provide all four option choices for matching combinations.');
        return;
      }
      const colA = [colA1, colA2, colA3, colA4].filter(Boolean);
      const colB = [colBP, colBQ, colBR, colBS].filter(Boolean);
      finalQuestionText = `Match the entries in Column A with Column B:\n\nColumn A:\n` + 
        colA.map((item, idx) => `${idx + 1}. ${item}`).join('\n') + 
        `\n\nColumn B:\n` + 
        colB.map((item, idx) => `${String.fromCharCode(65 + idx)}. ${item}`).join('\n');
      extraData = { 
        matchColumnA: [colA1, colA2, colA3, colA4].filter(Boolean), 
        matchColumnB: [colBP, colBQ, colBR, colBS].filter(Boolean) 
      };
    } else if (questionType === 'NUMERICAL') {
      if (!questionText || !correctAnswer) {
        setError('Please fill in the question text and the correct numerical answer.');
        return;
      }
      finalOptionA = "";
      finalOptionB = "";
      finalOptionC = "";
      finalOptionD = "";
    } else if (questionType === 'DIAGRAM') {
      if (!questionText || !optionA || !optionB || !optionC || !optionD) {
        setError('Please fill in question text and all four options.');
        return;
      }
      const hasDiagram = images.some(img => img.type === 'QUESTION' || img.type === 'DIAGRAM');
      if (!hasDiagram) {
        setError('Diagram Based Questions require a diagram image to be attached or pasted.');
        return;
      }
    }

    if (extraOptions.length > 0) {
      extraData = {
        ...(extraData || {}),
        additionalOptions: extraOptions,
      };
    }

    try {
      const isEdit = !!activeQId;
      const url = isEdit
        ? `/api/intern/tasks/${selectedAsg.id}/questions/${activeQId}`
        : `/api/intern/tasks/${selectedAsg.id}/questions`;

      const method = isEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionText: finalQuestionText,
          optionA: finalOptionA,
          optionB: finalOptionB,
          optionC: finalOptionC,
          optionD: finalOptionD,
          correctAnswer,
          detailedSolution,
          subject,
          topic,
          subTopic,
          concept,
          subConcept,
          classVal,
          examType: selectedExams.join(', '),
          questionType,
          extraData,
          images,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save question');

      const savedScrollTop = docViewportRef.current?.scrollTop || 0;

      setSuccess(isEdit ? 'Question updated successfully!' : 'Question added successfully!');
      clearForm();
      await fetchAssignments();

      // Restore document scroll position so intern does not lose place in worksheet
      setTimeout(() => {
        if (docViewportRef.current) {
          docViewportRef.current.scrollTop = savedScrollTop;
        }
      }, 50);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteQuestion = async (qId: string) => {
    if (!selectedAsg || !confirm('Are you sure you want to delete this question?')) return;
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`/api/intern/tasks/${selectedAsg.id}/questions/${qId}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete question');

      setSuccess('Question deleted successfully!');
      if (activeQId === qId) clearForm();
      fetchAssignments();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleMarkComplete = async () => {
    if (!selectedAsg) return;
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`/api/intern/tasks/${selectedAsg.id}/complete`, {
        method: 'POST',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to complete task');

      setSuccess('Task marked as completed! Your mentor has been notified.');
      fetchAssignments();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl+Enter or Cmd+Enter triggers save
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSaveQuestion();
    }
  };

  const handleCropComplete = (base64Url: string) => {
    // Optional cropper output goes to Cloudinary signed upload
    fetch(base64Url)
      .then((res) => res.blob())
      .then(async (blob) => {
        try {
          const url = await uploadImageDirect(blob, cropTargetType);
          setImages((prev) => [...prev, { imageUrl: url, type: cropTargetType }]);
          setSuccess(`Cropped image attached to ${cropTargetType} successfully!`);
        } catch (err: any) {
          setError(`Upload failed: ${err.message}`);
        }
      });
    setShowCropper(false);
  };

  const removeCroppedImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleExtractImages = async (fileUrl: string, fileName: string) => {
    setExtracting(fileName);
    setError('');
    try {
      let arrayBuffer: ArrayBuffer;

      if (fileUrl.startsWith('data:')) {
        const base64Data = fileUrl.split(',')[1] || fileUrl;
        const binaryString = atob(base64Data);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        arrayBuffer = bytes.buffer;
      } else {
        const res = await fetch(fileUrl);
        if (!res.ok) throw new Error('Failed to fetch document file');
        arrayBuffer = await res.arrayBuffer();
      }
      
      const JSZip = (await import('jszip')).default;
      const zip = await JSZip.loadAsync(arrayBuffer);
      const mediaFolder = zip.folder("word/media");
      
      if (!mediaFolder) {
        throw new Error('No embedded images found in this document (word/media folder is missing).');
      }

      const files = mediaFolder.files;
      const imagesFound: { name: string; url: string }[] = [];

      for (const [name, fileData] of Object.entries(files)) {
        if (fileData.dir) continue;
        const blob = await fileData.async("blob");
        const url = URL.createObjectURL(blob);
        const baseName = name.split('/').pop() || name;
        imagesFound.push({ name: baseName, url });
      }

      if (imagesFound.length === 0) {
        throw new Error('No image files found inside this document.');
      }

      setExtractedImages(imagesFound);
      setSuccess(`Successfully extracted ${imagesFound.length} images from ${fileName}!`);
    } catch (err: any) {
      setError(`Extraction failed: ${err.message}`);
    } finally {
      setExtracting(null);
    }
  };

  const handleAttachExtractedImage = async (blobUrl: string, type: string) => {
    setError('');
    setSuccess('');
    setUploadingField(type);
    try {
      const response = await fetch(blobUrl);
      const blob = await response.blob();
      
      const fileOfBlob = new File([blob], `extracted_${Date.now()}.png`, { type: 'image/png' });
      const url = await uploadImageDirect(fileOfBlob, type);
      setImages((prev) => [...prev, { imageUrl: url, type }]);
      setSuccess(`Extracted image successfully uploaded and attached to ${type}!`);
    } catch (err: any) {
      setError(`Failed to attach image: ${err.message}`);
    } finally {
      setUploadingField(null);
    }
  };

  const [zoomedImage, setZoomedImage] = useState<{ name: string; url: string } | null>(null);

  const handleCopyExtractedImage = async (blobUrl: string) => {
    setError('');
    setSuccess('');
    try {
      const response = await fetch(blobUrl);
      const blob = await response.blob();
      if (navigator.clipboard && window.ClipboardItem) {
        const item = new ClipboardItem({ [blob.type || 'image/png']: blob });
        await navigator.clipboard.write([item]);
        setSuccess('Image copied to clipboard! You can paste (Ctrl+V) it anywhere.');
      } else {
        await navigator.clipboard.writeText(blobUrl);
        setSuccess('Image URL copied to clipboard!');
      }
    } catch (err: any) {
      try {
        await navigator.clipboard.writeText(blobUrl);
        setSuccess('Image URL copied to clipboard!');
      } catch (e: any) {
        setError('Could not copy image automatically. Right-click the image and select "Copy image".');
      }
    }
  };

  if (loading) {
    return (
      <div className="h-[70vh] flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-brand-gold" />
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className="glass-panel p-12 rounded-2xl border border-brand-border text-center text-brand-muted italic h-[50vh] flex flex-col justify-center items-center">
        <ClipboardList className="w-12 h-12 text-zinc-700 mb-4" />
        <p>No daily tasks assigned to you yet.</p>
      </div>
    );
  }

  // Set up inline document viewer
  const fileUrl = selectedAsg?.task.fileUrl;
  const fileName = selectedAsg?.task.fileName;

  let filesList: { url: string; name: string }[] = [];
  if (fileUrl) {
    if (fileUrl.startsWith('[')) {
      try {
        filesList = JSON.parse(fileUrl);
      } catch (e) {
        filesList = [{ url: fileUrl, name: fileName || 'worksheet' }];
      }
    } else {
      filesList = [{ url: fileUrl, name: fileName || 'worksheet' }];
    }
  }

  // Academic hierarchy values based on selection
  const chapters = subject ? getChapters(subject, classVal) : [];
  const concepts = (subject && topic) ? getConcepts(subject, classVal, topic) : [];
  const conceptObj = concepts.find((c) => c.name === concept);
  const subConcepts = conceptObj ? conceptObj.subConcepts : [];

  return (
    <div className="flex flex-col h-full min-h-[85vh] space-y-6" onKeyDown={handleKeyDown}>
      {/* Top Header Selector & Deadline */}
      <div className="glass-panel p-6 rounded-2xl border border-brand-border flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 shrink-0 bg-black/40">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-xs font-semibold text-brand-gold uppercase tracking-wider">Active Task:</span>
          <select
            value={selectedAsg?.id}
            onChange={(e) => {
              const matched = assignments.find((a) => a.id === e.target.value);
              if (matched) {
                setSelectedAsg(matched);
                setActiveFileIndex(0);
                clearForm();
              }
            }}
            className="text-sm bg-black border border-brand-border text-white px-3 py-2 rounded-lg focus:outline-none focus:border-brand-gold w-64"
          >
            {assignments.map((asg) => (
              <option key={asg.id} value={asg.id}>
                {asg.task.title}
              </option>
            ))}
          </select>
        </div>

        {/* Countdown timer & Completion trigger */}
        {selectedAsg && (
          <div className="flex flex-wrap items-center gap-4">
            {timeLeft && (
              <div className="flex items-center gap-3">
                <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full animate-pulse border bg-amber-500/10 text-brand-gold border-brand-gold/20`}>
                  {deadlineAlert}
                </span>
                
                <div className="flex gap-2 text-xs bg-black/80 border border-brand-border p-2 rounded-xl text-center">
                  <div className="px-1"><span className="font-bold text-white block">{timeLeft.hours}h</span><span className="text-[9px] text-brand-muted uppercase">Hours</span></div>
                  <div className="px-1"><span className="font-bold text-white block">{timeLeft.mins}m</span><span className="text-[9px] text-brand-muted uppercase">Mins</span></div>
                  <div className="px-1"><span className="font-bold text-brand-gold block">{timeLeft.secs}s</span><span className="text-[9px] text-brand-muted uppercase">Secs</span></div>
                </div>
              </div>
            )}

            {selectedAsg.status !== 'COMPLETED' ? (
              <button
                onClick={handleMarkComplete}
                className="flex items-center gap-1.5 py-2.5 px-5 bg-brand-gold text-black hover:bg-brand-gold-hover font-bold rounded-lg shadow-lg shadow-brand-gold/15 transition cursor-pointer btn-gold border-0 shrink-0 text-sm"
              >
                <CheckCircle className="w-5 h-5" />
                <span>Mark Task Completed</span>
              </button>
            ) : (
              <span className="flex items-center gap-1.5 py-2.5 px-5 bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 font-semibold rounded-lg shrink-0 text-sm">
                <CheckCircle className="w-5 h-5" /> Verified Completed
              </span>
            )}
          </div>
        )}
      </div>

      {success && (
        <div className="bg-emerald-950/50 border border-emerald-500/50 text-emerald-200 px-4 py-3 rounded-lg text-sm text-center shrink-0">
          {success}
        </div>
      )}

      {error && (
        <div className="bg-red-950/50 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-sm text-center shrink-0">
          {error}
        </div>
      )}

      {/* Attached Worksheets & Download Bar */}
      {selectedAsg && filesList.length > 0 && (
        <div className="glass-panel p-4 rounded-2xl border border-brand-border bg-black/60 space-y-3 shrink-0">
          <div className="flex items-center justify-between border-b border-brand-border/40 pb-2">
            <span className="text-xs font-bold text-brand-gold uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-brand-gold" />
              <span>Assigned Worksheets ({filesList.length})</span>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {filesList.map((file, idx) => {
              const lowerName = (file.name || '').toLowerCase();
              const lowerUrl = (file.url || '').toLowerCase();
              const isDocx = lowerName.endsWith('.docx') || lowerName.endsWith('.doc') || lowerUrl.includes('.docx');

              return (
                <div key={idx} className="bg-zinc-900 border border-brand-border/70 p-3 rounded-xl flex items-center gap-3 shadow-md">
                  <FileText className="w-5 h-5 text-brand-gold shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate max-w-[240px]">{file.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isDocx && (
                      <button
                        onClick={() => handleExtractImages(file.url, file.name)}
                        disabled={extracting === file.name}
                        className="text-xs bg-zinc-800 hover:bg-zinc-700 text-brand-gold px-3 py-1.5 rounded-lg font-bold border-0 cursor-pointer disabled:opacity-50 transition flex items-center gap-1.5"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>{extracting === file.name ? 'Extracting...' : 'Extract Diagrams'}</span>
                      </button>
                    )}
                    <button
                      onClick={() => triggerFileDownload(file.url, file.name)}
                      className="text-xs bg-brand-gold hover:bg-brand-gold-hover text-black px-4 py-1.5 rounded-lg font-extrabold transition flex items-center gap-1.5 border-0 shadow cursor-pointer btn-gold"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>DOWNLOAD DOCUMENT</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Extracted Images gallery */}
          {extractedImages.length > 0 && (
            <div className="mt-3 p-4 bg-black/80 border border-brand-border rounded-xl">
              <div className="flex justify-between items-center mb-3 border-b border-brand-border/40 pb-2">
                <div>
                  <h4 className="text-xs uppercase font-extrabold tracking-wider text-brand-gold flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4" />
                    <span>Extracted Document Diagrams ({extractedImages.length})</span>
                  </h4>
                  <p className="text-[10px] text-zinc-400 mt-0.5">Click "Copy Image" or use quick attach to attach directly to form fields.</p>
                </div>
                <button
                  onClick={() => setExtractedImages([])}
                  className="text-xs text-red-400 hover:text-red-300 font-bold border-0 bg-transparent cursor-pointer"
                >
                  Clear Gallery
                </button>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[40vh] overflow-y-auto p-1 scrollbar-thin">
                {extractedImages.map((img, idx) => (
                  <div key={idx} className="flex flex-col bg-zinc-950 border border-brand-border/70 rounded-xl p-2.5 space-y-2 hover:border-brand-gold/40 transition shadow">
                    <div className="relative bg-white/95 rounded-lg p-2 flex items-center justify-center h-[140px] overflow-hidden border border-zinc-200">
                      <img
                        src={img.url}
                        alt={img.name}
                        className="max-h-[130px] w-auto object-contain cursor-pointer transition transform hover:scale-[1.02]"
                        onClick={() => setZoomedImage(img)}
                      />
                      <button
                        onClick={() => setZoomedImage(img)}
                        className="absolute top-1.5 right-1.5 bg-black/75 hover:bg-black text-white p-1 rounded text-xs flex items-center border-0 cursor-pointer"
                        title="Zoom image"
                      >
                        <Maximize2 className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-zinc-300 font-semibold truncate max-w-[100px]">{img.name}</span>
                        <button
                          onClick={() => handleCopyExtractedImage(img.url)}
                          className="flex items-center gap-1 bg-brand-gold hover:bg-brand-gold-hover text-black px-2 py-0.5 rounded text-[10px] font-bold transition border-0 cursor-pointer shadow"
                          title="Copy image"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </button>
                      </div>

                      <div className="bg-black/60 p-1.5 rounded border border-brand-border/30">
                        <span className="text-[8px] text-brand-gold font-bold uppercase tracking-wider block mb-1">Attach To:</span>
                        <div className="grid grid-cols-3 gap-1 text-[8px]">
                          <button
                            onClick={() => handleAttachExtractedImage(img.url, 'QUESTION')}
                            className="bg-brand-gold text-black py-0.5 px-0.5 rounded hover:bg-brand-gold-hover border-0 cursor-pointer font-bold text-center"
                          >
                            Qn
                          </button>
                          <button
                            onClick={() => handleAttachExtractedImage(img.url, 'SOLUTION')}
                            className="bg-brand-gold text-black py-0.5 px-0.5 rounded hover:bg-brand-gold-hover border-0 cursor-pointer font-bold text-center"
                          >
                            Soln
                          </button>
                          <button
                            onClick={() => handleAttachExtractedImage(img.url, 'OPTION_A')}
                            className="bg-zinc-800 text-white py-0.5 px-0.5 rounded hover:bg-zinc-700 border-0 cursor-pointer text-center"
                          >
                            Opt A
                          </button>
                          <button
                            onClick={() => handleAttachExtractedImage(img.url, 'OPTION_B')}
                            className="bg-zinc-800 text-white py-0.5 px-0.5 rounded hover:bg-zinc-700 border-0 cursor-pointer text-center"
                          >
                            Opt B
                          </button>
                          <button
                            onClick={() => handleAttachExtractedImage(img.url, 'OPTION_C')}
                            className="bg-zinc-800 text-white py-0.5 px-0.5 rounded hover:bg-zinc-700 border-0 cursor-pointer text-center"
                          >
                            Opt C
                          </button>
                          <button
                            onClick={() => handleAttachExtractedImage(img.url, 'OPTION_D')}
                            className="bg-zinc-800 text-white py-0.5 px-0.5 rounded hover:bg-zinc-700 border-0 cursor-pointer text-center"
                          >
                            Opt D
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Full-Width Question Entry Container */}
      {selectedAsg && (
        <div className="w-full flex-1 space-y-6">
          {/* Task Details description card */}
          <div className="p-4 bg-black/60 border border-brand-border rounded-xl shrink-0">
            <h4 className="text-xs uppercase font-extrabold tracking-wider text-brand-gold mb-1.5">Task Instructions</h4>
            <p className="text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed">{selectedAsg.task.description}</p>
          </div>

          {/* Question Form & Submissions list */}
          <div className="glass-panel rounded-2xl border border-brand-border flex flex-col bg-black/40 p-6 space-y-6">
            {/* Drafted list */}
            <div className="glass-panel p-6 rounded-2xl border border-brand-border space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-brand-border">
                <span className="text-xs font-bold text-brand-gold uppercase tracking-wider flex items-center gap-1.5">
                  <ClipboardList className="w-4 h-4" />
                  <span>Submitted Questions ({selectedAsg.questions.length})</span>
                </span>
                
                <button
                  type="button"
                  onClick={clearForm}
                  className="flex items-center gap-1 py-1.5 px-3 bg-zinc-900 hover:bg-zinc-800 text-brand-gold rounded border border-brand-border text-xs font-semibold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> New Question
                </button>
              </div>

              <div className="space-y-2 max-h-40 overflow-y-auto">
                {selectedAsg.questions.map((q, idx) => (
                  <div key={q.id} className="p-3 bg-black/45 border border-brand-border rounded-xl flex items-center justify-between text-xs hover:border-brand-gold/20 transition">
                    <div className="min-w-0">
                      <p className="font-semibold text-white truncate max-w-xs">{q.questionText}</p>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[9px] text-brand-muted mt-1 max-w-lg">
                        <div>Chapter (Topic): <span className="text-zinc-300 font-medium">{q.topic}</span></div>
                        <div>Concept: <span className="text-zinc-300 font-medium">{q.concept}</span></div>
                        <div>Class: <span className="text-zinc-300 font-medium">{q.classVal}</span></div>
                        <div>Difficulty: <span className="text-brand-gold font-medium">{q.difficulty}</span></div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                        q.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400' :
                        q.status === 'REJECTED' ? 'bg-red-500/10 text-red-400' :
                        q.status === 'CORRECTION_REQUESTED' ? 'bg-amber-500/10 text-amber-400 animate-pulse' :
                        'bg-zinc-500/10 text-zinc-400'
                      }`}>
                        {q.status}
                      </span>
                      <button
                        onClick={() => loadQuestionForEdit(q)}
                        className="p-1 bg-zinc-900 border border-brand-border rounded text-brand-gold hover:bg-zinc-800 cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="p-1 bg-red-950/20 border border-red-900/30 rounded text-red-400 hover:bg-red-950/50 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
                {selectedAsg.questions.length === 0 && (
                  <div className="text-center text-brand-muted text-xs italic py-4 bg-zinc-950/30 border border-brand-border border-dashed rounded-lg">
                    No questions logged for this task yet (Target: 100–110 Questions)
                  </div>
                )}
              </div>
            </div>

            {/* Question Entry Form */}
            <div className="glass-panel p-6 rounded-2xl border border-brand-border space-y-6">
              <div className="border-b border-brand-border pb-3 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-white text-base">
                    {activeQId ? 'Edit Question Draft' : 'Add New Question'}
                  </h3>
                  <p className="text-[10px] text-brand-muted uppercase font-bold mt-0.5 tracking-widest">Question Entry Form (Press Ctrl+Enter to Save)</p>
                </div>
                <span className="text-[10px] bg-white/5 border border-zinc-800 text-brand-muted px-2 py-0.5 rounded font-mono">
                  {images.length} images attached
                </span>
              </div>

              {/* Subject & Class Select (NCERT Trigger Chapters) */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-brand-text uppercase tracking-wider mb-2">Subject (NCERT) *</label>
                  <select
                    required
                    value={subject}
                    onChange={(e) => {
                      setSubject(e.target.value);
                      setTopic('');
                      setConcept('');
                      setSubConcept('');
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-brand-border bg-black text-white focus:outline-none focus:border-brand-gold text-xs"
                  >
                    <option value="">Select Subject</option>
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Biology">Biology</option>
                    <option value="Mathematics">Mathematics</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-brand-text uppercase tracking-wider mb-2">Class *</label>
                  <select
                    value={classVal}
                    onChange={(e) => {
                      setClassVal(e.target.value);
                      setTopic('');
                      setConcept('');
                      setSubConcept('');
                    }}
                    className="w-full text-xs bg-black border border-brand-border text-white px-2 py-2 rounded-lg focus:outline-none focus:border-brand-gold"
                  >
                    <option value="11th">Class 11</option>
                    <option value="12th">Class 12</option>
                  </select>
                </div>
              </div>

              {/* Dynamic NCERT Chapter (Topic) Loading */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-brand-text uppercase tracking-wider mb-2">NCERT Chapter (Topic) *</label>
                  <select
                    required
                    value={topic}
                    onChange={(e) => {
                      setTopic(e.target.value);
                      setConcept('');
                      setSubConcept('');
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-brand-border bg-black text-white focus:outline-none focus:border-brand-gold text-xs"
                    disabled={!subject}
                  >
                    <option value="">Select Chapter</option>
                    {chapters.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Concept text input for copy-pasting / typing */}
                <div>
                  <label className="block text-[10px] font-semibold text-brand-text uppercase tracking-wider mb-2">Concept (NCERT) *</label>
                  <input
                    type="text"
                    required
                    list="concept-list"
                    value={concept}
                    onChange={(e) => setConcept(e.target.value)}
                    onPaste={(e) => {
                      const pasteText = e.clipboardData?.getData('text/plain');
                      if (pasteText) {
                        e.preventDefault();
                        setConcept(pasteText.trim());
                      }
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-brand-border bg-black text-white focus:outline-none focus:border-brand-gold text-xs placeholder:text-zinc-600"
                    placeholder="Type or copy paste concept..."
                  />
                  {concepts.length > 0 && (
                    <datalist id="concept-list">
                      {concepts.map((c) => (
                        <option key={c.name} value={c.name} />
                      ))}
                    </datalist>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-brand-text uppercase tracking-wider mb-2">Exam Categories *</label>
                  <div className="flex flex-wrap gap-1.5 bg-black p-1.5 rounded-lg border border-brand-border min-h-[36px] items-center">
                    {['NEET', 'JEE', 'KCET'].map((exam) => {
                      const isChecked = selectedExams.includes(exam);
                      return (
                        <button
                          type="button"
                          key={exam}
                          onClick={() => {
                            if (isChecked) {
                              setSelectedExams(prev => prev.filter(x => x !== exam));
                            } else {
                              setSelectedExams(prev => [...prev, exam]);
                            }
                          }}
                          className={`px-2 py-1 rounded text-[10px] font-bold transition select-none border border-0 cursor-pointer ${
                            isChecked
                              ? 'bg-brand-gold text-black'
                              : 'bg-zinc-900 text-zinc-400 hover:text-white'
                          }`}
                        >
                          {exam}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-brand-text uppercase tracking-wider mb-2">Question Type *</label>
                  <select
                    value={questionType}
                    onChange={(e) => setQuestionType(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-brand-border bg-black text-white focus:outline-none focus:border-brand-gold text-xs"
                  >
                    <option value="MCQ">Standard MCQ</option>
                    <option value="ASSERTION_REASON">Assertion & Reason</option>
                    <option value="STATEMENT_BASED">Statement Based</option>
                    <option value="TRUE_FALSE">True / False</option>
                    <option value="MATCH_THE_FOLLOWING">Match the Following</option>
                    <option value="NUMERICAL">Numerical Answer Type</option>
                    <option value="DIAGRAM">Diagram Based Question</option>
                  </select>
                </div>
              </div>

              {/* DYNAMIC FIELDS BASE ON QUESTION TYPE */}

              {/* MCQ or DIAGRAM or TRUE_FALSE or NUMERICAL or STATEMENT_BASED standard text field */}
              {(questionType === 'MCQ' || questionType === 'DIAGRAM' || questionType === 'TRUE_FALSE' || questionType === 'NUMERICAL' || questionType === 'STATEMENT_BASED') && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="block text-[10px] font-semibold text-brand-text uppercase tracking-wider">
                      {questionType === 'TRUE_FALSE' ? 'Statement *' : questionType === 'NUMERICAL' ? 'Numerical Question *' : 'Question Text *'}
                    </label>
                    <div className="flex gap-2">
                      <label className="flex items-center gap-1 text-[9px] font-bold text-brand-gold cursor-pointer bg-zinc-900 border border-brand-border px-2 py-0.5 rounded hover:bg-zinc-800">
                        <Paperclip className="w-3 h-3" />
                        <span>Attach Image</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleUploadImageFile(e, 'QUESTION')}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                  
                  {questionType === 'DIAGRAM' && (
                    <div className="bg-brand-gold/10 border border-brand-gold/25 p-2 rounded text-[10px] text-brand-gold leading-relaxed">
                      💡 <strong>Diagram-Based Question:</strong> You must attach or paste a diagram image below.
                    </div>
                  )}

                  <MathToolbar
                    targetRef={questionTextareaRef}
                    currentValue={questionText}
                    onUpdate={setQuestionText}
                    className="mb-1.5"
                  />

                  <textarea
                    ref={questionTextareaRef}
                    required
                    rows={9}
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    onBlur={(e) => setQuestionText(formatCleanText(e.target.value))}
                    onPaste={(e) => handlePasteImage(e, 'QUESTION')}
                    className="w-full px-3.5 py-3 rounded-lg border border-brand-border bg-black text-white focus:outline-none focus:border-brand-gold text-sm leading-relaxed min-h-[200px] resize-y font-mono"
                    placeholder={
                      questionType === 'DIAGRAM' 
                        ? "Type question text referring to the diagram, and attach the diagram image..." 
                        : "Type question text or paste image (Ctrl+V) directly inside here..."
                    }
                  />

                  {questionText && (
                    <div className="p-4 bg-zinc-950 border border-brand-gold/40 rounded-xl text-white mt-2 space-y-2 shadow-lg">
                      <div className="flex justify-between items-center border-b border-brand-border/40 pb-1.5">
                        <span className="text-[10px] font-extrabold text-brand-gold uppercase tracking-widest flex items-center gap-1.5">
                          <span>✨ Live Typeset Equation Preview (Word / LaTeX Quality)</span>
                        </span>
                      </div>
                      <div className="text-base sm:text-lg text-white py-2 overflow-x-auto flex justify-center">
                        <MathRenderer text={questionText} />
                      </div>
                    </div>
                  )}
                  
                  {uploadingField === 'QUESTION' && <p className="text-[10px] text-brand-gold animate-pulse">Uploading image...</p>}
                  
                  {images.filter((img) => img.type === 'QUESTION').map((img, i) => (
                    <div key={i} className="inline-flex items-center gap-2 bg-zinc-900 p-1.5 rounded-lg border border-brand-border mt-1">
                      <img src={img.imageUrl} alt="Question Asset" className="max-h-12 object-contain rounded" />
                      <button type="button" onClick={() => removeCroppedImage(images.indexOf(img))} className="text-red-400 hover:text-white p-0.5">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* ASSERTION & REASON */}
              {questionType === 'ASSERTION_REASON' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-semibold text-brand-text uppercase tracking-wider">Assertion (A) *</label>
                    <textarea
                      required
                      rows={2}
                      value={assertionText}
                      onChange={(e) => setAssertionText(formatCleanText(e.target.value))}
                      onBlur={(e) => setAssertionText(formatCleanText(e.target.value))}
                      onPaste={(e) => handlePasteImage(e, 'ASSERTION')}
                      className="w-full px-3 py-2 rounded-lg border border-brand-border bg-black text-white focus:outline-none focus:border-brand-gold text-xs"
                      placeholder="Type Assertion (A)..."
                    />
                    {assertionText && (
                      <div className="p-3 bg-zinc-950 border border-brand-gold/40 rounded-xl text-white mt-1.5 space-y-1 shadow-lg">
                        <span className="text-[10px] font-extrabold text-brand-gold uppercase tracking-widest block border-b border-brand-border/40 pb-1">✨ Assertion (A) Live Typeset Preview</span>
                        <div className="text-sm sm:text-base text-white py-1 overflow-x-auto">
                          <MathRenderer text={assertionText} />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-semibold text-brand-text uppercase tracking-wider">Reason (R) *</label>
                    <textarea
                      required
                      rows={2}
                      value={reasonText}
                      onChange={(e) => setReasonText(formatCleanText(e.target.value))}
                      onBlur={(e) => setReasonText(formatCleanText(e.target.value))}
                      onPaste={(e) => handlePasteImage(e, 'REASON')}
                      className="w-full px-3 py-2 rounded-lg border border-brand-border bg-black text-white focus:outline-none focus:border-brand-gold text-xs"
                      placeholder="Type Reason (R)..."
                    />
                    {reasonText && (
                      <div className="p-3 bg-zinc-950 border border-brand-gold/40 rounded-xl text-white mt-1.5 space-y-1 shadow-lg">
                        <span className="text-[10px] font-extrabold text-brand-gold uppercase tracking-widest block border-b border-brand-border/40 pb-1">✨ Reason (R) Live Typeset Preview</span>
                        <div className="text-sm sm:text-base text-white py-1 overflow-x-auto">
                          <MathRenderer text={reasonText} />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-3 bg-black/40 border border-brand-border rounded-xl text-[11px] text-zinc-400 space-y-1">
                    <p className="font-bold text-brand-gold">Predefined Options:</p>
                    <p><strong>A:</strong> A and R are true and R is the correct explanation.</p>
                    <p><strong>B:</strong> A and R are true but R is not the correct explanation.</p>
                    <p><strong>C:</strong> A is true but R is false.</p>
                    <p><strong>D:</strong> A is false but R is true.</p>
                  </div>
                </div>
              )}

              {/* MATCH THE FOLLOWING */}
              {questionType === 'MATCH_THE_FOLLOWING' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-[10px] font-semibold text-brand-text uppercase tracking-wider">Column A *</label>
                      <input
                        type="text"
                        required
                        value={colA1}
                        onChange={(e) => setColA1(formatCleanText(e.target.value))}
                        onBlur={(e) => setColA1(formatCleanText(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg border border-brand-border bg-black text-white focus:outline-none focus:border-brand-gold text-xs"
                        placeholder="Row 1 *"
                      />
                      <input
                        type="text"
                        required
                        value={colA2}
                        onChange={(e) => setColA2(formatCleanText(e.target.value))}
                        onBlur={(e) => setColA2(formatCleanText(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg border border-brand-border bg-black text-white focus:outline-none focus:border-brand-gold text-xs"
                        placeholder="Row 2 *"
                      />
                      <input
                        type="text"
                        value={colA3}
                        onChange={(e) => setColA3(formatCleanText(e.target.value))}
                        onBlur={(e) => setColA3(formatCleanText(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg border border-brand-border bg-black text-white focus:outline-none focus:border-brand-gold text-xs"
                        placeholder="Row 3 (Optional)"
                      />
                      <input
                        type="text"
                        value={colA4}
                        onChange={(e) => setColA4(formatCleanText(e.target.value))}
                        onBlur={(e) => setColA4(formatCleanText(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg border border-brand-border bg-black text-white focus:outline-none focus:border-brand-gold text-xs"
                        placeholder="Row 4 (Optional)"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-semibold text-brand-text uppercase tracking-wider">Column B *</label>
                      <input
                        type="text"
                        required
                        value={colBP}
                        onChange={(e) => setColBP(formatCleanText(e.target.value))}
                        onBlur={(e) => setColBP(formatCleanText(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg border border-brand-border bg-black text-white focus:outline-none focus:border-brand-gold text-xs"
                        placeholder="Row P *"
                      />
                      <input
                        type="text"
                        required
                        value={colBQ}
                        onChange={(e) => setColBQ(formatCleanText(e.target.value))}
                        onBlur={(e) => setColBQ(formatCleanText(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg border border-brand-border bg-black text-white focus:outline-none focus:border-brand-gold text-xs"
                        placeholder="Row Q *"
                      />
                      <input
                        type="text"
                        value={colBR}
                        onChange={(e) => setColBR(formatCleanText(e.target.value))}
                        onBlur={(e) => setColBR(formatCleanText(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg border border-brand-border bg-black text-white focus:outline-none focus:border-brand-gold text-xs"
                        placeholder="Row R (Optional)"
                      />
                      <input
                        type="text"
                        value={colBS}
                        onChange={(e) => setColBS(formatCleanText(e.target.value))}
                        onBlur={(e) => setColBS(formatCleanText(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg border border-brand-border bg-black text-white focus:outline-none focus:border-brand-gold text-xs"
                        placeholder="Row S (Optional)"
                      />
                    </div>
                  </div>

                  {(colA1 || colA2 || colBP || colBQ) && (
                    <div className="p-3 bg-zinc-950 border border-brand-gold/40 rounded-xl text-white space-y-2 shadow-lg">
                      <span className="text-[10px] font-extrabold text-brand-gold uppercase tracking-widest block border-b border-brand-border/40 pb-1">✨ Match Columns Live Typeset Preview</span>
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div className="space-y-1">
                          <p className="font-semibold text-zinc-400 border-b border-brand-border/30 pb-0.5">Column A</p>
                          {colA1 && <div>1. <MathRenderer text={colA1} inline /></div>}
                          {colA2 && <div>2. <MathRenderer text={colA2} inline /></div>}
                          {colA3 && <div>3. <MathRenderer text={colA3} inline /></div>}
                          {colA4 && <div>4. <MathRenderer text={colA4} inline /></div>}
                        </div>
                        <div className="space-y-1">
                          <p className="font-semibold text-zinc-400 border-b border-brand-border/30 pb-0.5">Column B</p>
                          {colBP && <div>P. <MathRenderer text={colBP} inline /></div>}
                          {colBQ && <div>Q. <MathRenderer text={colBQ} inline /></div>}
                          {colBR && <div>R. <MathRenderer text={colBR} inline /></div>}
                          {colBS && <div>S. <MathRenderer text={colBS} inline /></div>}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Option Choice Inputs (shown for all question types EXCEPT Numerical) */}
              {questionType !== 'NUMERICAL' && (
                <div className="space-y-3">
                  <label className="block text-[10px] font-semibold text-brand-text uppercase tracking-wider">
                    {questionType === 'STATEMENT_BASED' || questionType === 'MATCH_THE_FOLLOWING' 
                      ? 'Option Combinations *' 
                      : 'Options *'}
                  </label>
                  {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                    const fieldName = `OPTION_${opt}`;
                    return (
                      <div key={opt} className="space-y-1">
                        <div className="flex gap-3 items-center">
                          <span className="w-6 h-6 rounded-full bg-zinc-900 border border-brand-border flex items-center justify-center font-bold text-xs text-brand-gold shrink-0">
                            {opt}
                          </span>
                          
                          <input
                            type="text"
                            required
                            value={opt === 'A' ? optionA : opt === 'B' ? optionB : opt === 'C' ? optionC : optionD}
                            onChange={(e) => {
                              const cleaned = formatCleanText(e.target.value);
                              if (opt === 'A') setOptionA(cleaned);
                              else if (opt === 'B') setOptionB(cleaned);
                              else if (opt === 'C') setOptionC(cleaned);
                              else setOptionD(cleaned);
                            }}
                            onBlur={(e) => {
                              const cleaned = formatCleanText(e.target.value);
                              if (opt === 'A') setOptionA(cleaned);
                              else if (opt === 'B') setOptionB(cleaned);
                              else if (opt === 'C') setOptionC(cleaned);
                              else setOptionD(cleaned);
                            }}
                            onPaste={(e) => handlePasteImage(e, fieldName)}
                            className="flex-1 px-3 py-2 rounded-lg border border-brand-border bg-black text-white focus:outline-none focus:border-brand-gold text-xs"
                            placeholder={
                              questionType === 'STATEMENT_BASED' 
                                ? `e.g. Option ${opt} (e.g. Only 1 & 2 are correct)`
                                : questionType === 'MATCH_THE_FOLLOWING'
                                  ? `e.g. Option ${opt} (e.g. 1-P, 2-Q, 3-R, 4-S)`
                                  : `Type Option ${opt} text or paste image (Ctrl+V)...`
                            }
                          />

                          {questionType !== 'NUMERICAL' && (
                            <label className="p-1.5 bg-zinc-900 border border-brand-border rounded text-brand-gold hover:bg-zinc-800 cursor-pointer">
                              <Paperclip className="w-3.5 h-3.5" />
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleUploadImageFile(e, fieldName)}
                                className="hidden"
                              />
                            </label>
                          )}
                        </div>

                        {uploadingField === fieldName && <p className="text-[10px] text-brand-gold animate-pulse pl-9">Uploading Option {opt} image...</p>}

                        {/* Option math preview */}
                        {(opt === 'A' ? optionA : opt === 'B' ? optionB : opt === 'C' ? optionC : optionD) && (
                          <div className="ml-9 p-2.5 bg-zinc-950 border border-brand-border/60 rounded-lg text-white text-xs mt-1 space-y-1">
                            <span className="text-[9px] font-bold text-brand-gold uppercase tracking-wider block">Option {opt} Preview:</span>
                            <div className="text-xs text-white">
                              <MathRenderer text={opt === 'A' ? optionA : opt === 'B' ? optionB : opt === 'C' ? optionC : optionD} inline />
                            </div>
                          </div>
                        )}

                        {/* Option image previews */}
                        {images.filter((img) => img.type === fieldName).map((img, i) => (
                          <div key={i} className="inline-flex items-center gap-2 bg-zinc-900 p-1.5 rounded-lg border border-brand-border mt-1 ml-9">
                            <img src={img.imageUrl} alt={`Option ${opt} Asset`} className="max-h-10 object-contain rounded" />
                            <button type="button" onClick={() => removeCroppedImage(images.indexOf(img))} className="text-red-400 hover:text-white p-0.5">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    );
                  })}

                  {/* Dynamic Extra Options (E, F, G...) */}
                  {extraOptions.map((optVal, idx) => {
                    const letter = String.fromCharCode(69 + idx);
                    const fieldName = `OPTION_${letter}`;
                    return (
                      <div key={letter} className="space-y-1">
                        <div className="flex gap-3 items-center">
                          <span className="w-6 h-6 rounded-full bg-brand-gold/20 border border-brand-gold flex items-center justify-center font-bold text-xs text-brand-gold shrink-0">
                            {letter}
                          </span>

                          <input
                            type="text"
                            required
                            value={optVal}
                            onChange={(e) => handleUpdateExtraOption(idx, e.target.value)}
                            onPaste={(e) => handlePasteImage(e, fieldName)}
                            className="flex-1 px-3 py-2 rounded-lg border border-brand-border bg-black text-white focus:outline-none focus:border-brand-gold text-xs"
                            placeholder={`Type Option ${letter} text or paste image (Ctrl+V)...`}
                          />

                          {questionType !== 'NUMERICAL' && (
                            <label className="p-1.5 bg-zinc-900 border border-brand-border rounded text-brand-gold hover:bg-zinc-800 cursor-pointer">
                              <Paperclip className="w-3.5 h-3.5" />
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleUploadImageFile(e, fieldName)}
                                className="hidden"
                              />
                            </label>
                          )}

                          <button
                            type="button"
                            onClick={() => handleRemoveExtraOption(idx)}
                            className="p-1.5 bg-red-950/30 hover:bg-red-950/60 border border-red-900/40 text-red-400 rounded transition cursor-pointer"
                            title={`Remove Option ${letter}`}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {uploadingField === fieldName && <p className="text-[10px] text-brand-gold animate-pulse pl-9">Uploading Option {letter} image...</p>}

                        {/* Option image previews */}
                        {images.filter((img) => img.type === fieldName).map((img, i) => (
                          <div key={i} className="inline-flex items-center gap-2 bg-zinc-900 p-1.5 rounded-lg border border-brand-border mt-1 ml-9">
                            <img src={img.imageUrl} alt={`Option ${letter} Asset`} className="max-h-10 object-contain rounded" />
                            <button type="button" onClick={() => removeCroppedImage(images.indexOf(img))} className="text-red-400 hover:text-white p-0.5">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    );
                  })}

                  {/* Add More Options Button */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={handleAddExtraOption}
                      className="flex items-center gap-1.5 py-1.5 px-3 bg-zinc-900 hover:bg-zinc-800 text-brand-gold border border-brand-border rounded-lg text-xs font-semibold cursor-pointer transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Option {String.fromCharCode(69 + extraOptions.length)}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Correct Option Dropdown */}
              <div className="w-1/2">
                <label className="block text-[10px] font-semibold text-brand-text uppercase tracking-wider mb-2">
                  {questionType === 'NUMERICAL' ? 'Correct Numerical Value *' : 'Correct Option *'}
                </label>
                {questionType === 'NUMERICAL' ? (
                  <input
                    type="text"
                    required
                    value={correctAnswer}
                    onChange={(e) => setCorrectAnswer(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-brand-border bg-black text-white focus:outline-none focus:border-brand-gold text-xs font-mono"
                    placeholder="e.g. 25.6 or 4"
                  />
                ) : questionType === 'TRUE_FALSE' ? (
                  <select
                    value={correctAnswer}
                    onChange={(e) => setCorrectAnswer(e.target.value)}
                    className="w-full text-xs bg-black border border-brand-border text-white px-2 py-2 rounded-lg focus:outline-none focus:border-brand-gold"
                  >
                    <option value="A">True</option>
                    <option value="B">False</option>
                  </select>
                ) : (
                  <select
                    value={correctAnswer}
                    onChange={(e) => setCorrectAnswer(e.target.value)}
                    className="w-full text-xs bg-black border border-brand-border text-white px-2 py-2 rounded-lg focus:outline-none focus:border-brand-gold"
                  >
                    {['A', 'B', 'C', 'D', ...extraOptions.map((_, idx) => String.fromCharCode(69 + idx))].map((opt) => (
                      <option key={opt} value={opt}>Option {opt}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Detailed Solution with paste-to-attach */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] font-semibold text-brand-text uppercase tracking-wider">Detailed Solution *</label>
                  <label className="flex items-center gap-1 text-[9px] font-bold text-brand-gold cursor-pointer bg-zinc-900 border border-brand-border px-2 py-0.5 rounded hover:bg-zinc-800">
                    <Paperclip className="w-3 h-3" />
                    <span>Attach Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleUploadImageFile(e, 'SOLUTION')}
                      className="hidden"
                    />
                  </label>
                </div>

                <MathToolbar
                  targetRef={solutionTextareaRef}
                  currentValue={detailedSolution}
                  onUpdate={setDetailedSolution}
                  className="mb-1.5"
                />
                
                <textarea
                  ref={solutionTextareaRef}
                  required
                  rows={8}
                  value={detailedSolution}
                  onChange={(e) => setDetailedSolution(e.target.value)}
                  onBlur={(e) => setDetailedSolution(formatCleanText(e.target.value))}
                  onPaste={(e) => handlePasteImage(e, 'SOLUTION')}
                  className="w-full px-3.5 py-3 rounded-lg border border-brand-border bg-black text-white focus:outline-none focus:border-brand-gold text-xs sm:text-sm leading-relaxed min-h-[180px] resize-y font-mono"
                  placeholder="Type step-by-step solution or paste image (Ctrl+V) directly inside..."
                />

                {uploadingField === 'SOLUTION' && <p className="text-[10px] text-brand-gold animate-pulse">Uploading Solution image...</p>}

                {detailedSolution && (
                  <div className="p-4 bg-zinc-950 border border-brand-gold/40 rounded-xl text-white mt-2 space-y-2 shadow-lg">
                    <div className="flex justify-between items-center border-b border-brand-border/40 pb-1.5">
                      <span className="text-[10px] font-extrabold text-brand-gold uppercase tracking-widest flex items-center gap-1.5">
                        <span>✨ Live Typeset Solution Preview (Word / LaTeX Quality)</span>
                      </span>
                    </div>
                    <div className="text-sm text-white py-1">
                      <MathRenderer text={detailedSolution} />
                    </div>
                  </div>
                )}

                {/* Solution image previews */}
                {images.filter((img) => img.type === 'SOLUTION').map((img, i) => (
                  <div key={i} className="inline-flex items-center gap-2 bg-zinc-900 p-1.5 rounded-lg border border-brand-border mt-1">
                    <img src={img.imageUrl} alt="Solution Asset" className="max-h-12 object-contain rounded" />
                    <button type="button" onClick={() => removeCroppedImage(images.indexOf(img))} className="text-red-400 hover:text-white p-0.5">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Optional Cropper tool button */}
              <div className="space-y-2 border-t border-brand-border/40 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-brand-muted uppercase font-bold">Image Bounding Cropper (Optional)</span>
                  <button
                    type="button"
                    onClick={() => setShowCropper(!showCropper)}
                    className="text-[10px] text-brand-gold hover:underline flex items-center gap-1 font-semibold"
                  >
                    <ImageIcon className="w-3 h-3" />
                    <span>{showCropper ? 'Close Cropper' : 'Open Cropper'}</span>
                  </button>
                </div>

                {showCropper && (
                  <div className="space-y-3 bg-black/60 border border-brand-border p-4 rounded-xl">
                    <div className="flex gap-2">
                      <select
                        value={cropTargetType}
                        onChange={(e) => setCropTargetType(e.target.value)}
                        className="text-xs bg-black border border-brand-border text-white px-2 py-1.5 rounded-lg focus:outline-none focus:border-brand-gold"
                      >
                        <option value="QUESTION">Question diagram</option>
                        <option value="OPTION_A">Option A diagram</option>
                        <option value="OPTION_B">Option B diagram</option>
                        <option value="OPTION_C">Option C diagram</option>
                        <option value="OPTION_D">Option D diagram</option>
                        <option value="SOLUTION">Solution diagram</option>
                      </select>
                    </div>
                    <ImageCropper onCropComplete={handleCropComplete} onCancel={() => setShowCropper(false)} />
                  </div>
                )}
              </div>

              {/* Form buttons */}
              <div className="pt-4 border-t border-brand-border flex gap-3">
                <button
                  type="button"
                  onClick={clearForm}
                  className="flex-1 py-2 px-4 rounded-lg bg-zinc-900 border border-brand-border hover:bg-zinc-850 text-zinc-300 text-xs font-semibold transition cursor-pointer"
                >
                  Cancel / Clear
                </button>
                
                <button
                  type="button"
                  onClick={handleSaveQuestion}
                  className="flex-1 py-2 px-4 rounded-lg bg-brand-gold hover:bg-brand-gold-hover text-black text-xs font-bold transition cursor-pointer btn-gold border-0 flex items-center justify-center gap-1"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Draft (Ctrl+Enter)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Zoomed Image Lightbox Modal */}
      {zoomedImage && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="max-w-4xl w-full bg-zinc-950 border border-brand-border rounded-2xl p-4 flex flex-col gap-4 max-h-[90vh]">
            <div className="flex justify-between items-center border-b border-brand-border/40 pb-2">
              <span className="text-sm font-bold text-white truncate">{zoomedImage.name}</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleCopyExtractedImage(zoomedImage.url)}
                  className="flex items-center gap-1.5 bg-brand-gold hover:bg-brand-gold-hover text-black px-3 py-1.5 rounded text-xs font-bold transition border-0 cursor-pointer"
                >
                  <Copy className="w-4 h-4" /> Copy Image
                </button>
                <button
                  onClick={() => setZoomedImage(null)}
                  className="text-zinc-400 hover:text-white p-1 rounded border-0 bg-transparent cursor-pointer"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto flex items-center justify-center bg-white rounded-xl p-4">
              <img src={zoomedImage.url} alt={zoomedImage.name} className="max-h-[70vh] w-auto object-contain" />
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Document Lightbox Modal */}
      {fullscreenDoc && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="w-full h-full max-w-6xl bg-zinc-950 border border-brand-border rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex justify-between items-center border-b border-brand-border/40 pb-2">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-5 h-5 text-brand-gold shrink-0" />
                <span className="text-base font-bold text-white truncate max-w-xl">{fullscreenDoc.name}</span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <a
                  href={fullscreenDoc.isPdf ? (fullscreenDoc.url.includes('res.cloudinary.com') && fullscreenDoc.url.includes('/raw/upload/') ? fullscreenDoc.url.replace('/raw/upload/', '/image/upload/') : fullscreenDoc.url) : fullscreenDoc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 bg-brand-gold text-black px-3.5 py-1.5 rounded-lg text-xs font-bold transition hover:bg-brand-gold-hover"
                >
                  <ExternalLink className="w-4 h-4" /> Open in Browser Tab
                </a>
                <a
                  href={fullscreenDoc.url}
                  download
                  className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition"
                >
                  <Download className="w-4 h-4" /> Download
                </a>
                <button
                  onClick={() => setFullscreenDoc(null)}
                  className="text-zinc-400 hover:text-white p-1 rounded-lg border-0 bg-transparent cursor-pointer"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="flex-1 bg-zinc-950 text-white rounded-xl overflow-hidden min-h-0 flex flex-col items-center justify-center p-8 text-center space-y-4">
              <FileText className="w-16 h-16 text-brand-gold mx-auto" />
              <div className="space-y-1">
                <h3 className="text-lg font-bold">{fullscreenDoc.name}</h3>
                <p className="text-xs text-brand-muted">Click below to download the original document file.</p>
              </div>
              <button
                onClick={() => triggerFileDownload(fullscreenDoc.url, fullscreenDoc.name)}
                className="bg-brand-gold text-black hover:bg-brand-gold-hover px-6 py-2.5 rounded-xl text-sm font-extrabold flex items-center gap-2 border-0 cursor-pointer shadow-lg"
              >
                <Download className="w-4 h-4" /> DOWNLOAD DOCUMENT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
