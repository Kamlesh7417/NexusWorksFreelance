'use client';

import { useState, useRef } from 'react';
import { useSupabaseAuth } from '@/contexts/supabase-auth-context';
import { StorageService } from '@/lib/supabase';
import { Upload, File, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface FileUploadProps {
  bucket: string;
  path?: string;
  accept?: string;
  maxSize?: number; // in MB
  onUploadComplete?: (url: string, path: string) => void;
  onUploadError?: (error: string) => void;
}

export function FileUpload({ 
  bucket, 
  path = '', 
  accept = '*/*', 
  maxSize = 10,
  onUploadComplete,
  onUploadError 
}: FileUploadProps) {
  const { user } = useSupabaseAuth();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ name: string; url: string; path: string }>>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setError(null);
    
    for (const file of Array.from(files)) {
      await uploadFile(file);
    }
  };

  const uploadFile = async (file: File) => {
    if (!user) {
      setError('You must be logged in to upload files');
      return;
    }

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      const errorMsg = `File size must be less than ${maxSize}MB`;
      setError(errorMsg);
      onUploadError?.(errorMsg);
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Create unique file path
      const timestamp = Date.now();
      const fileExt = file.name.split('.').pop();
      const fileName = `${timestamp}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = path ? `${path}/${fileName}` : fileName;

      // Upload file
      const { data, error } = await StorageService.uploadFile(bucket, filePath, file);

      if (error) {
        throw error;
      }

      // Get public URL
      const publicUrl = StorageService.getPublicUrl(bucket, filePath);

      // Add to uploaded files list
      const uploadedFile = {
        name: file.name,
        url: publicUrl,
        path: filePath
      };

      setUploadedFiles(prev => [...prev, uploadedFile]);
      onUploadComplete?.(publicUrl, filePath);

      setUploadProgress(100);
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to upload file';
      setError(errorMsg);
      onUploadError?.(errorMsg);
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const removeFile = async (filePath: string) => {
    try {
      await StorageService.deleteFile(bucket, filePath);
      setUploadedFiles(prev => prev.filter(f => f.path !== filePath));
    } catch (err: any) {
      setError(err.message || 'Failed to delete file');
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    
    if (files && files.length > 0) {
      for (const file of Array.from(files)) {
        uploadFile(file);
      }
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="border-2 border-dashed border-cyan-500/30 rounded-lg p-8 text-center hover:border-cyan-500/50 transition-colors cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <Upload size={48} className="mx-auto mb-4 text-cyan-400" />
        <h3 className="text-lg font-semibold text-cyan-400 mb-2">Upload Files</h3>
        <p className="text-gray-400 mb-2">
          Drag and drop files here, or click to select
        </p>
        <p className="text-sm text-gray-500">
          Maximum file size: {maxSize}MB
        </p>
      </div>

      {/* Upload Progress */}
      {uploading && (
        <div className="bg-white/5 border border-white/20 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
            <span className="text-sm text-cyan-400">Uploading...</span>
            <span className="text-sm text-gray-400">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-cyan-400 to-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/40 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-red-400" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="bg-white/5 border border-white/20 rounded-lg p-4">
          <h4 className="text-cyan-400 font-semibold mb-3 flex items-center gap-2">
            <CheckCircle size={16} />
            Uploaded Files
          </h4>
          <div className="space-y-2">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <File size={16} className="text-cyan-400" />
                  <div>
                    <p className="text-sm font-medium text-white">{file.name}</p>
                    <a 
                      href={file.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-cyan-400 hover:text-cyan-300"
                    >
                      View file
                    </a>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(file.path)}
                  className="p-1 hover:bg-red-500/20 rounded text-red-400 hover:text-red-300"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}