'use client';

import React, { useState, useCallback, useRef } from 'react';
import { DjangoUser } from '@/components/auth/django-auth-provider';
import { apiClient } from '@/lib/api-client';
import { useSmartNotifications } from '@/lib/services/smart-notifications';
import { 
  Upload, 
  FileText, 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  Download,
  Eye,
  Trash2,
  RefreshCw,
  Brain,
  Star,
  Clock
} from 'lucide-react';

interface ResumeUploaderProps {
  user: DjangoUser;
  onUpdate: () => void;
}

interface ResumeAnalysis {
  skills_extracted: string[];
  experience_years: number;
  education: string[];
  certifications: string[];
  summary: string;
  recommendations: string[];
  parsing_status: 'pending' | 'processing' | 'completed' | 'failed';
  confidence_score: number;
}

interface ResumeData {
  id: string;
  filename: string;
  upload_date: string;
  file_size: number;
  analysis: ResumeAnalysis | null;
  status: 'uploaded' | 'processing' | 'analyzed' | 'failed';
}

export function ResumeUploader({ user, onUpdate }: ResumeUploaderProps) {
  const { showSuccess, showError } = useSmartNotifications();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState(0);

  // Load existing resume data on component mount
  React.useEffect(() => {
    loadResumeData();
  }, []);

  const loadResumeData = async () => {
    try {
      // Check if user has an existing resume
      const response = await apiClient.makeRequest('/ai-services/resume-status/', {
        method: 'GET'
      });

      if (response.data && !response.error) {
        setResumeData(response.data as ResumeData);
      }
    } catch (error) {
      console.error('Error loading resume data:', error);
    }
  };

  const handleFileSelect = useCallback((file: File) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];

    if (!allowedTypes.includes(file.type)) {
      showError('Please upload a PDF, DOC, DOCX, or TXT file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      showError('File size must be less than 10MB');
      return;
    }

    uploadResume(file);
  }, [showError]);

  const uploadResume = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('resume', file);

      const response = await apiClient.makeRequest('/ai-services/upload-resume/', {
        method: 'POST',
        body: formData,
        headers: {}, // Remove Content-Type to let browser set it for FormData
      });

      if (response.error) {
        throw new Error(response.error);
      }

      const uploadResult = response.data as { resume_id: string };
      showSuccess('Resume uploaded successfully! AI analysis starting...');
      
      // Start polling for analysis status
      startAnalysisPolling(uploadResult.resume_id);
      
      onUpdate();
    } catch (error) {
      console.error('Resume upload error:', error);
      showError(error instanceof Error ? error.message : 'Failed to upload resume');
    } finally {
      setUploading(false);
    }
  };

  const startAnalysisPolling = async (resumeId: string) => {
    setAnalyzing(true);
    setAnalysisProgress(0);
    
    const pollInterval = setInterval(async () => {
      try {
        const response = await apiClient.makeRequest(`/ai-services/resume-status/${resumeId}/`, {
          method: 'GET'
        });

        if (response.data) {
          const data = response.data as ResumeData;
          setResumeData(data);
          
          // Update progress based on status
          switch (data.status) {
            case 'uploaded':
              setAnalysisProgress(25);
              break;
            case 'processing':
              setAnalysisProgress(50);
              break;
            case 'analyzed':
              setAnalysisProgress(100);
              setAnalyzing(false);
              clearInterval(pollInterval);
              showSuccess('Resume analysis completed!');
              break;
            case 'failed':
              setAnalyzing(false);
              clearInterval(pollInterval);
              showError('Resume analysis failed. Please try uploading again.');
              break;
          }
        }
      } catch (error) {
        console.error('Error polling analysis status:', error);
        setAnalyzing(false);
        clearInterval(pollInterval);
      }
    }, 2000);

    // Stop polling after 5 minutes
    setTimeout(() => {
      clearInterval(pollInterval);
      if (analyzing) {
        setAnalyzing(false);
        showError('Analysis timeout. Please try again.');
      }
    }, 300000);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDeleteResume = async () => {
    if (!resumeData) return;
    
    try {
      const response = await apiClient.makeRequest(`/ai-services/resume/${resumeData.id}/`, {
        method: 'DELETE'
      });

      if (response.error) {
        throw new Error(response.error);
      }

      setResumeData(null);
      showSuccess('Resume deleted successfully');
      onUpdate();
    } catch (error) {
      console.error('Error deleting resume:', error);
      showError('Failed to delete resume');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderAnalysisResults = () => {
    if (!resumeData?.analysis) return null;

    const analysis = resumeData.analysis;

    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Brain size={20} className="text-green-400" />
            <h4 className="text-lg font-semibold text-white">AI Analysis Results</h4>
            <div className="flex items-center gap-1 ml-auto">
              <Star size={16} className="text-yellow-400" />
              <span className="text-sm text-gray-400">
                {Math.round(analysis.confidence_score * 100)}% confidence
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Skills Extracted */}
            <div>
              <h5 className="font-medium text-white mb-3">Skills Extracted ({analysis.skills_extracted.length})</h5>
              <div className="flex flex-wrap gap-2">
                {analysis.skills_extracted.slice(0, 10).map((skill, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-cyan-500/20 border border-cyan-500/40 rounded text-xs text-cyan-400"
                  >
                    {skill}
                  </span>
                ))}
                {analysis.skills_extracted.length > 10 && (
                  <span className="px-2 py-1 bg-gray-500/20 border border-gray-500/40 rounded text-xs text-gray-400">
                    +{analysis.skills_extracted.length - 10} more
                  </span>
                )}
              </div>
            </div>

            {/* Experience & Education */}
            <div className="space-y-4">
              <div>
                <h5 className="font-medium text-white mb-2">Experience</h5>
                <p className="text-gray-300 text-sm">
                  {analysis.experience_years} years of professional experience
                </p>
              </div>
              
              {analysis.education.length > 0 && (
                <div>
                  <h5 className="font-medium text-white mb-2">Education</h5>
                  <div className="space-y-1">
                    {analysis.education.map((edu, index) => (
                      <p key={index} className="text-gray-300 text-sm">{edu}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Summary */}
          {analysis.summary && (
            <div className="mt-6 pt-6 border-t border-white/10">
              <h5 className="font-medium text-white mb-3">Professional Summary</h5>
              <p className="text-gray-300 text-sm leading-relaxed">{analysis.summary}</p>
            </div>
          )}

          {/* Recommendations */}
          {analysis.recommendations.length > 0 && (
            <div className="mt-6 pt-6 border-t border-white/10">
              <h5 className="font-medium text-white mb-3">AI Recommendations</h5>
              <div className="space-y-2">
                {analysis.recommendations.map((rec, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-300 text-sm">{rec}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">
          <FileText size={20} />
          Resume Upload & AI Analysis
        </h3>
        <p className="text-gray-400 text-sm mb-6">
          Upload your resume for AI-powered skill extraction and profile enhancement
        </p>
      </div>

      {!resumeData ? (
        /* Upload Area */
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragOver
              ? 'border-cyan-400 bg-cyan-500/10'
              : 'border-white/20 hover:border-white/40'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            onChange={handleFileInputChange}
            className="hidden"
          />
          
          <div className="space-y-4">
            <div className="w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto">
              {uploading ? (
                <Loader2 size={24} className="text-cyan-400 animate-spin" />
              ) : (
                <Upload size={24} className="text-cyan-400" />
              )}
            </div>
            
            <div>
              <h4 className="text-lg font-semibold text-white mb-2">
                {uploading ? 'Uploading Resume...' : 'Upload Your Resume'}
              </h4>
              <p className="text-gray-400 text-sm mb-4">
                Drag and drop your resume here, or click to browse
              </p>
              <p className="text-gray-500 text-xs">
                Supported formats: PDF, DOC, DOCX, TXT (max 10MB)
              </p>
            </div>
            
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-400 font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'Uploading...' : 'Choose File'}
            </button>
          </div>
        </div>
      ) : (
        /* Resume Info & Analysis */
        <div className="space-y-6">
          {/* Resume File Info */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <FileText size={20} className="text-green-400" />
                </div>
                <div>
                  <h4 className="font-medium text-white">{resumeData.filename}</h4>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span>{formatFileSize(resumeData.file_size)}</span>
                    <span>Uploaded {new Date(resumeData.upload_date).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-blue-400 rounded-lg transition-colors"
                  title="Upload new resume"
                >
                  <RefreshCw size={16} />
                </button>
                <button
                  onClick={handleDeleteResume}
                  className="p-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-400 rounded-lg transition-colors"
                  title="Delete resume"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center gap-2">
              {resumeData.status === 'analyzed' ? (
                <CheckCircle size={16} className="text-green-400" />
              ) : resumeData.status === 'failed' ? (
                <AlertCircle size={16} className="text-red-400" />
              ) : (
                <Clock size={16} className="text-yellow-400" />
              )}
              <span className="text-sm text-gray-300 capitalize">
                {resumeData.status === 'analyzed' ? 'Analysis Complete' : 
                 resumeData.status === 'failed' ? 'Analysis Failed' :
                 resumeData.status === 'processing' ? 'Analyzing...' : 'Uploaded'}
              </span>
            </div>

            {/* Analysis Progress */}
            {analyzing && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">AI Analysis Progress</span>
                  <span className="text-sm text-cyan-400">{analysisProgress}%</span>
                </div>
                <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-500"
                    style={{ width: `${analysisProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Hidden file input for re-upload */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            onChange={handleFileInputChange}
            className="hidden"
          />

          {/* Analysis Results */}
          {resumeData.status === 'analyzed' && renderAnalysisResults()}

          {/* Failed Analysis */}
          {resumeData.status === 'failed' && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 text-center">
              <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-red-400 mb-2">Analysis Failed</h4>
              <p className="text-gray-300 mb-4">
                We couldn't analyze your resume. This might be due to file format issues or content that's difficult to parse.
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-400 font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Try Different File
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}