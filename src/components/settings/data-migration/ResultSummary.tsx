
import React from 'react';
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { 
  Alert, 
  AlertDescription, 
  AlertTitle 
} from "@/components/ui/alert";
import { ResultSummaryProps } from './types';

export const ResultSummary: React.FC<ResultSummaryProps> = ({ importResults }) => {
  if (!importResults) return null;

  const { success, added, skipped, issues } = importResults;

  return (
    <div className="space-y-4">
      <Alert 
        variant={success ? "default" : "error"}
        className={success ? "bg-green-50 border-green-200" : ""}
      >
        {success ? (
          <CheckCircle className="h-4 w-4 text-green-600" />
        ) : (
          <XCircle className="h-4 w-4" />
        )}
        <AlertTitle>{success ? "Import Successful" : "Import Failed"}</AlertTitle>
        <AlertDescription>
          {success ? (
            <>
              Successfully imported {added} items.
              {skipped > 0 && ` ${skipped} items were skipped.`}
            </>
          ) : (
            <>Import failed. Please check the data and try again.</>
          )}
        </AlertDescription>
      </Alert>

      {issues && issues.length > 0 && (
        <div>
          <h3 className="text-md font-medium mb-2 flex items-center">
            <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
            Issues ({issues.length})
          </h3>
          <div className="max-h-40 overflow-y-auto bg-gray-50 p-4 rounded border">
            <ul className="list-disc pl-5 space-y-1">
              {issues.map((issue, index) => (
                <li key={index} className="text-sm">
                  Row {issue.row}: {issue.reason}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
