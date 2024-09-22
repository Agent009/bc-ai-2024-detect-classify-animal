"use client";
import React from "react";
import { ChangeEvent, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button, Tab, Tabs } from "@mui/material";
import { styled } from "@mui/material/styles";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CreateIcon from "@mui/icons-material/Create";
import { getApiUrl } from "@lib/api.ts";
import { constants } from "@lib/index";

const VisuallyHiddenInput = styled("input")({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
  whiteSpace: "nowrap",
  width: 1,
});
const TAB_UPLOAD = 0;
const TAB_DETECT = 1;
const TAB_CLASSIFY = 2;

export default function Chat() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState("");
  const [needsNewClassification, setNeedsNewClassification] = useState(true);
  const [classifying, setClassifying] = useState(false);
  const [state, setState] = useState({
    detection: [],
    isDetected: false,
    classification: [],
    isClassified: false,
    maxTokens: constants.openAI.maxTokens,
  });
  const [tabValue, setTabValue] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const animals = state.detection?.join(", ");

  const detectAnimals = async (file: File) => {
    setIsProcessing(true);
    setStatus("Detecting animal...");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("message", "Detect the animals in the image.");

      const detection = await fetch(getApiUrl(constants.routes.api.chat), {
        method: "POST",
        body: formData,
      }).then((res) => res.json());

      console.log("page -> detectAnimals -> detection", detection);

      if (detection?.error) {
        setStatus(detection?.error);
      } else {
        let data = detection?.animals || detection || [];
        data = Array.isArray(data) ? data : [];
        setState((prevState) => ({
          ...prevState,
          detection: data,
          isDetected: true,
        }));
        setNeedsNewClassification(data.length > 0);
        setStatus("");
        setTabValue(TAB_DETECT);
      }
    } catch (error) {
      console.error("Error in handleFileUpload:", error);
      setStatus(`Error processing file: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsProcessing(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const classifyAnimals = async () => {
    setStatus("Classifying animals...");
    setClassifying(true);
    setNeedsNewClassification(false);

    const classification = await fetch(getApiUrl(constants.routes.api.classify), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ animals: state.detection }),
    }).then((res) => res.json());

    console.log("page -> classifyAnimal -> classification", classification);
    setClassifying(false);

    if (classification?.error) {
      setStatus(classification?.error);
    } else {
      let data = classification?.classifications || classification || [];
      data = data || [];
      setState((prevState) => ({
        ...prevState,
        classification: data,
        isClassified: true,
      }));
      setStatus("Classification ready.");
      setTabValue(TAB_CLASSIFY);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-grow overflow-y-auto p-4 max-w-3xl mx-auto">
        <div className="mx-auto space-y-4 text-center mb-10">
          <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
            Detect and Classify Animals
          </h1>
          <p className="text-lg text-zinc-400 dark:text-purple-300 max-w-2xl mx-auto">
            Upload an image of an animal and I'll tell you if it's dangerous or not.
          </p>
          {status && <p className="my-2 mt-10 m-10">{status}</p>}
        </div>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="tabs">
          <Tab value={TAB_UPLOAD} label="Upload" icon={<CloudUploadIcon />} />
          <Tab value={TAB_DETECT} label="Detect" icon={<Loader2 />} />
          <Tab value={TAB_CLASSIFY} label="Classify" icon={<CreateIcon />} />
        </Tabs>

        {tabValue === TAB_UPLOAD && (
          <div className="space-y-6 bg-gradient-to-br from-indigo-900 to-purple-900 rounded-xl p-6 mt-6 shadow-lg">
            <h3 className="text-2xl font-bold text-center text-white mb-4">Upload Animal Image</h3>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="w-full items-center sm:w-auto relative">
                <Button
                  component="label"
                  role={undefined}
                  variant="contained"
                  tabIndex={-1}
                  startIcon={<CloudUploadIcon />}
                  disabled={isProcessing}
                  className="w-full sm:w-auto bg-purple-800 text-white hover:bg-purple-600"
                >
                  {isProcessing ? "Loading..." : "Upload Animal Image to Detect & Classify"}
                  <VisuallyHiddenInput
                    id="file-upload"
                    ref={fileInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png"
                    onChange={async (e: ChangeEvent<HTMLInputElement>) => {
                      if (e.target.files) {
                        const file = e.target.files[0];
                        // Check file type
                        if (!file.type.match(/image\/(jpeg|png)/)) {
                          setStatus("Error: Only JPG and PNG images are allowed.");
                          return;
                        }

                        try {
                          await detectAnimals(file);
                        } catch (error) {
                          console.error("Error in detectAnimals:", error);
                          setStatus(
                            `Error processing file: ${error instanceof Error ? error.message : "Unknown error"}`,
                          );
                        }
                      }
                    }}
                    className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 h-auto py-2 text-white disabled:bg-purple-900 disabled:text-white disabled:opacity-50"
                    disabled={isProcessing}
                    // multiple
                  />
                </Button>
                {isProcessing && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                    <Loader2 className="h-6 w-6 animate-spin" color="white" />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {tabValue === TAB_DETECT && (
          <div className="space-y-6 bg-gradient-to-br from-indigo-900 to-purple-900 rounded-xl p-6 mt-6 shadow-lg">
            <h3 className="text-2xl font-bold text-center text-white mb-4">Detect Animal</h3>
            <div className="text-center">
              <Button
                variant="contained"
                onClick={() => {
                  setTabValue(TAB_UPLOAD);
                }}
                className="w-full sm:w-auto bg-indigo-900 text-white hover:bg-indigo-800 disabled:bg-purple-900 disabled:text-white disabled:opacity-50"
              >
                Try Another Image
              </Button>
              <div className="my-2 flex h-3/4 flex-auto flex-col space-y-2 mt-10 text-white">
                <span className="font-semibold">Detected Animal</span>
                <span>{animals}</span>
              </div>
              <Button
                variant="contained"
                disabled={isProcessing || !needsNewClassification || classifying}
                onClick={async () => {
                  await classifyAnimals();
                }}
                className="w-full sm:w-auto bg-purple-800 text-white hover:bg-purple-600 disabled:bg-purple-900 disabled:text-white disabled:opacity-50"
              >
                {classifying
                  ? "Classifying..."
                  : needsNewClassification
                    ? animals.length
                      ? "Classify"
                      : "No animals detected"
                    : "Classified!"}
              </Button>
            </div>
          </div>
        )}

        {tabValue === TAB_CLASSIFY && (
          <>
            <div className="space-y-6 bg-gradient-to-br from-indigo-900 to-purple-900 rounded-xl p-6 mt-6 shadow-lg">
              <h3 className="text-2xl font-bold text-center text-white mb-4">Animal Classification</h3>
              {classifying || needsNewClassification ? (
                <div className="text-center text-white">
                  {classifying
                    ? "Please wait while the animal is being classified."
                    : "Please upload an animal image file first."}
                </div>
              ) : (
                <>
                  {state.classification && (
                    <div className="my-2 flex h-3/4 flex-auto flex-col space-y-2 mt-10 text-white text-center">
                      <span className="font-semibold">Classification(s)</span>
                      {state.classification.map(({ name, classification }) => (
                        <span
                          key={name}
                          style={{
                            color:
                              classification === "Dangerous"
                                ? "red"
                                : classification === "Friendly"
                                  ? "green"
                                  : "inherit",
                          }}
                        >
                          {name}: {classification}
                        </span>
                      ))}
                    </div>
                  )}
                </>
              )}
              {isProcessing && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
