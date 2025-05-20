
import React, { useState } from 'react';
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FileUploadProps } from './types';

export const FileUpload: React.FC<FileUploadProps> = ({ setSelectedFile, setUploadError }) => {
  const [dragActive, setDragActive] = useState(false);
  
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files[0]);
    }
  };
  
  const handleFiles = (file: File) => {
    const fileType = file.name.split('.').pop()?.toLowerCase();
    if (fileType !== 'csv' && fileType !== 'xlsx' && fileType !== 'xls') {
      setUploadError("Please upload a CSV or Excel file");
      setSelectedFile(null);
      return;
    }
    
    setUploadError(null);
    setSelectedFile(file);
  };

  return (
    <div 
      className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors"
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      style={{ borderColor: dragActive ? "rgb(99 102 241)" : "rgb(209 213 219)" }}
    >
      <Upload className="mx-auto h-12 w-12 text-gray-400" />
      <div className="mt-2">
        <label htmlFor="file-upload" className="cursor-pointer">
          <span className="text-indigo-600 font-medium">Click to upload</span>
          <span className="text-gray-500"> or drag and drop</span>
        </label>
        <p className="text-xs text-gray-500">CSV, XLS, XLSX up to 10MB</p>
      </div>
      <input
        id="file-upload"
        name="file-upload"
        type="file"
        className="sr-only"
        onChange={handleChange}
        accept=".csv,.xls,.xlsx"
      />
      <div className="mt-4">
        <Button variant="outline" onClick={() => document.getElementById('file-upload')?.click()}>
          Select File
        </Button>
      </div>
    </div>
  );
};
