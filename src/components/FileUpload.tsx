
import { useState } from "react";
import { X, Plus, File, FileText, FileImage, FileVideo } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

interface FileUploadProps {
  maxFiles?: number;
  onFilesChange: (files: string[]) => void;
  initialFiles?: string[];
  label?: string;
  description?: string;
  allowedTypes?: string;
}

const FileUpload = ({
  maxFiles = 5,
  onFilesChange,
  initialFiles = [],
  label = "Files",
  description = "Upload files related to your project or portfolio",
  allowedTypes = "All files",
}: FileUploadProps) => {
  const [files, setFiles] = useState<string[]>(initialFiles);
  const [fileUrl, setFileUrl] = useState<string>("");

  const addFile = () => {
    if (!fileUrl.trim()) return;
    
    if (files.length >= maxFiles) {
      alert(`You can only add up to ${maxFiles} files.`);
      return;
    }
    
    const newFiles = [...files, fileUrl.trim()];
    setFiles(newFiles);
    onFilesChange(newFiles);
    setFileUrl("");
  };

  const removeFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
    onFilesChange(newFiles);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addFile();
    }
  };

  const isValidUrl = (url: string) => {
    try {
      return Boolean(url.trim()) && 
        (url.startsWith('http://') || url.startsWith('https://'));
    } catch (_) {
      return false;
    }
  };

  const getFileIcon = (url: string) => {
    const lowercase = url.toLowerCase();
    if (lowercase.endsWith('.jpg') || lowercase.endsWith('.jpeg') || lowercase.endsWith('.png') || lowercase.endsWith('.gif') || lowercase.endsWith('.webp')) {
      return <FileImage size={18} />;
    } else if (lowercase.endsWith('.mp4') || lowercase.endsWith('.webm') || lowercase.endsWith('.mov')) {
      return <FileVideo size={18} />;
    } else if (lowercase.endsWith('.pdf') || lowercase.endsWith('.doc') || lowercase.endsWith('.docx') || lowercase.endsWith('.txt')) {
      return <FileText size={18} />;
    } else {
      return <File size={18} />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Input
            value={fileUrl}
            onChange={(e) => setFileUrl(e.target.value)}
            placeholder="Enter file URL (e.g., https://example.com/document.pdf)"
            onKeyPress={handleKeyPress}
            className={!isValidUrl(fileUrl) && fileUrl.trim() !== "" ? "border-red-300" : ""}
          />
          {!isValidUrl(fileUrl) && fileUrl.trim() !== "" && (
            <p className="text-xs text-red-500 mt-1">
              Please enter a valid URL (starting with http:// or https://)
            </p>
          )}
        </div>
        <Button 
          type="button" 
          onClick={addFile}
          disabled={!isValidUrl(fileUrl) || files.length >= maxFiles}
        >
          <Plus size={16} className="mr-1" />
          Add
        </Button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {/* File previews */}
        {files.map((file, index) => (
          <div 
            key={index} 
            className="relative p-3 rounded-md border border-border group flex items-center"
          >
            {getFileIcon(file)}
            <div className="ml-2 truncate flex-1">
              <a 
                href={file} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-sm hover:underline truncate block"
              >
                {file.split('/').pop() || file}
              </a>
            </div>
            <button
              type="button"
              onClick={() => removeFile(index)}
              className="ml-2 text-muted-foreground hover:text-foreground"
              aria-label="Remove file"
            >
              <X size={16} />
            </button>
          </div>
        ))}
        
        {/* Upload placeholder */}
        {files.length === 0 && (
          <div className="p-6 rounded-md border-2 border-dashed border-border flex flex-col items-center justify-center col-span-full">
            <File size={24} className="text-muted-foreground mb-1" />
            <span className="text-sm text-muted-foreground">
              {description}
            </span>
          </div>
        )}
      </div>
      
      <p className="text-xs text-muted-foreground">
        {files.length} of {maxFiles} files added. {allowedTypes} are supported.
      </p>
    </div>
  );
};

export default FileUpload;
