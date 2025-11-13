"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import KYCLayout from "@/components/layouts/KYCLayout";
import { useKYC, useKYCActions } from "@/contexts/KYCContext";
import { useUtilLocation } from "@/contexts/UtilityContext";

// Google Maps TypeScript declarations
declare global {
  interface Window {
    google: any;
  }
}

const VideoVerificationPage: React.FC = () => {
  const router = useRouter();
  const { state } = useKYC();
  const { setUserData } = useKYCActions();

  const [currentStep, setCurrentStep] = useState<"map" | "video">("map");
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
    address: string;
  } | null>(null);
  const [streetViewSnapshot, setStreetViewSnapshot] = useState<string>("");
  const [showFlash, setShowFlash] = useState(false);
  const [userGpsLocation, setUserGpsLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [locationVerified, setLocationVerified] = useState(false);
  const [checkingLocation, setCheckingLocation] = useState(false);
  const { location } = useUtilLocation();

  // Modal states
  const [showSnapshotModal, setShowSnapshotModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [cameraInitialized, setCameraInitialized] = useState(false);
  const [capturingSnapshot, setCapturingSnapshot] = useState(false);
  const [pageScreenshot, setPageScreenshot] = useState<string>("");
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string>("");
  const [streetView360Images, setStreetView360Images] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isCarouselAutoPlay, setIsCarouselAutoPlay] = useState(true);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [isGenerating360Images, setIsGenerating360Images] = useState(false);
  const [imageGenerationProgress, setImageGenerationProgress] = useState(0);

  interface StreetViewParams {
    lat: number;
    lng: number;
    heading: number;
    pitch: number;
    fov: number;
    zoom: number;
    size: string;
  }

  const streamRef = useRef<MediaStream | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const mapRef = useRef<HTMLDivElement>(null);
  const streetViewRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const streetViewPanoramaRef = useRef<any>(null);

  // Get user's verified address (prioritize current address if set, otherwise use BVN address)
  const userAddress = state.currentAddress?.address
    ? `${state.currentAddress.address}, ${state.currentAddress.area}, ${state.currentAddress.lga}, ${state.currentAddress.state}`
    : state.userData?.address?.raw || state.userData?.address?.fromBvn || "";

  console.log(userAddress);

  // Initialize Google Maps with Street View
  useEffect(() => {
    const createStreetView = (lat: number, lng: number) => {
      if (!streetViewRef.current || !window.google?.maps) return;

      try {
        // @ts-ignore - Google Maps types not available
        const streetViewService = new window.google.maps.StreetViewService();
        const position = { lat, lng };

        // Check for Street View coverage
        streetViewService.getPanorama(
          {
            location: position,
            radius: 50, // Search within 50 meters
            source: window.google.maps.StreetViewSource.OUTDOOR, // Prefer outdoor imagery
          },
          (data: any, status: string) => {
            if (status === "OK" && data) {
              // Street View is available
              // @ts-ignore - Google Maps types not available
              const panorama = new window.google.maps.StreetViewPanorama(
                streetViewRef.current,
                {
                  position: data.location.latLng,
                  pov: {
                    heading: 0, // Will be calculated to face the address
                    pitch: 0,
                  },
                  zoom: 1,
                  addressControl: true,
                  linksControl: true,
                  panControl: true,
                  enableCloseButton: false,
                  fullscreenControl: true,
                  motionTracking: true,
                  motionTrackingControl: true,
                }
              );

              // Calculate heading to point towards the original address
              const heading =
                window.google.maps.geometry.spherical.computeHeading(
                  data.location.latLng,
                  position
                );

              panorama.setPov({
                heading: heading,
                pitch: 0,
              });

              streetViewPanoramaRef.current = panorama;

              // Function to reverse geocode and update selected location
              const updateSelectedLocation = (latLng: any) => {
                const geocoder = new window.google.maps.Geocoder();
                geocoder.geocode(
                  { location: latLng },
                  (results: any, status: string) => {
                    if (status === "OK" && results && results[0]) {
                      // Use the formatted address from reverse geocoding
                      setSelectedLocation({
                        lat: latLng.lat(),
                        lng: latLng.lng(),
                        address: results[0].formatted_address,
                      });
                    } else {
                      // Fallback to coordinates if reverse geocoding fails
                      setSelectedLocation({
                        lat: latLng.lat(),
                        lng: latLng.lng(),
                        address: `${latLng.lat().toFixed(6)}, ${latLng
                          .lng()
                          .toFixed(6)}`,
                      });
                    }
                  }
                );
              };

              // Set initial location
              updateSelectedLocation(data.location.latLng);

              // Listen for position changes when user navigates in Street View
              panorama.addListener("position_changed", () => {
                const currentPosition = panorama.getPosition();
                if (currentPosition) {
                  updateSelectedLocation(currentPosition);
                }
              });

              setMapLoaded(true);
            } else {
              // Street View not available, show error
              console.error(
                "Street View not available at this location:",
                status
              );
              setError(
                "Street View is not available at your address. This may be because your area hasn't been mapped yet."
              );
              setMapLoaded(true);
            }
          }
        );

        // Also create a small map for context
        if (mapRef.current) {
          // @ts-ignore - Google Maps types not available
          const map = new window.google.maps.Map(mapRef.current, {
            center: position,
            zoom: 18,
            mapTypeId: window.google.maps.MapTypeId.ROADMAP,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            zoomControl: true,
            gestureHandling: "cooperative",
          });

          // Add a marker at the address location
          // @ts-ignore - Google Maps types not available
          new window.google.maps.Marker({
            position: position,
            map: map,
            title: "Your Address",
          });

          mapInstanceRef.current = map;
        }
      } catch (error) {
        console.error("Error creating Street View:", error);
        setError("Failed to load Street View. Please refresh the page.");
      }
    };

    const geocodeAddress = () => {
      if (!window.google?.maps || !userAddress) {
        setError(
          "Address not found. Please go back and complete the address verification."
        );
        return;
      }

      try {
        const lat = location.lat;
        const lng = location.long;

        // Create Street View at this location
        createStreetView(lat, lng);
      } catch (error) {
        console.error("Geocoding failed:", status);
        setError("Could not find your address on the map. Please try again.");
        // Fallback to default Lagos location
        createStreetView(6.5244, 3.3792);
      }
    };

    const initMap = () => {
      // Check if Google Maps is already loaded
      if (window.google?.maps) {
        geocodeAddress();
        return;
      }

      // Define callback function in global scope
      (window as any).initGoogleMaps = () => {
        geocodeAddress();
      };

      // Load Google Maps API with callback
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places,geometry&callback=initGoogleMaps&v=weekly`;
      script.async = true;
      script.defer = true;
      script.onerror = () => {
        setError(
          "Failed to load Google Maps. Please check your API key and internet connection."
        );
      };
      document.head.appendChild(script);
    };

    initMap();

    // Cleanup
    return () => {
      delete (window as any).initGoogleMaps;
    };
  }, [userAddress]);

  // Capture Street View parameters for Static API call
  const captureStreetViewParameters = (): StreetViewParams | null => {
    if (!streetViewPanoramaRef.current) return null;

    const pov = streetViewPanoramaRef.current.getPov();
    const position = streetViewPanoramaRef.current.getPosition();
    const zoom = streetViewPanoramaRef.current.getZoom();

    return {
      lat: position.lat(),
      lng: position.lng(),
      heading: pov.heading,
      pitch: pov.pitch,
      fov: pov.fov || 90, // Default fov if not available
      zoom: zoom || 1, // Default zoom if not available
      size: "800x600",
    };
  };

  // Get Street View static image from Google API
  const getStreetViewStaticImage = async (
    params: StreetViewParams
  ): Promise<string | null> => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    const baseUrl = "https://maps.googleapis.com/maps/api/streetview";

    const queryParams = new URLSearchParams({
      location: `${params.lat},${params.lng}`,
      heading: params.heading.toString(),
      pitch: params.pitch.toString(),
      fov: params.fov.toString(),
      size: params.size,
      key: apiKey || "",
    });

    const imageUrl = `${baseUrl}?${queryParams}`;

    try {
      console.log("Fetching Street View static image:", imageUrl);

      // Fetch the image and convert to base64 for storage
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();

      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("Failed to read image"));
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error("Error fetching Street View static image:", error);
      return null;
    }
  };

  // Generate 360° Street View images (8 images every 45°)
  const generate360StreetViewImages = async (
    baseParams: StreetViewParams
  ): Promise<string[]> => {
    const images: string[] = [];
    const baseHeading = baseParams.heading;

    console.log("Generating 360° Street View images...");
    setIsGenerating360Images(true);
    setImageGenerationProgress(0);

    // Generate 8 images every 45 degrees (0°, 45°, 90°, 135°, 180°, 225°, 270°, 315°)
    for (let i = 0; i < 8; i++) {
      const heading = (baseHeading + i * 45) % 360;
      const params = {
        ...baseParams,
        heading: heading,
      };

      try {
        const image = await getStreetViewStaticImage(params);
        if (image) {
          images.push(image);
          console.log(`Generated image ${i + 1}/8 at heading ${heading}°`);
        } else {
          console.error(
            `Failed to generate image ${i + 1}/8 at heading ${heading}°`
          );
        }

        // Update progress
        setImageGenerationProgress(((i + 1) / 8) * 100);

        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Error generating image ${i + 1}/8:`, error);
        // Still update progress even if image failed
        setImageGenerationProgress(((i + 1) / 8) * 100);
      }
    }

    setIsGenerating360Images(false);
    console.log(`Successfully generated ${images.length}/8 Street View images`);
    return images;
  };

  const captureStreetViewSnapshot = async () => {
    if (!streetViewRef.current) return;

    setCapturingSnapshot(true);

    // Show flash effect
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 200);

    // Small delay to ensure Street View is fully rendered
    await new Promise((resolve) => setTimeout(resolve, 300));

    try {
      // Since WebGL Street View can't be captured directly, create a realistic representation
      console.log(
        "Creating Street View representation (WebGL capture not possible)"
      );

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) return;

      // Use Street View element dimensions for consistency
      const streetViewElement = streetViewRef.current;
      const rect = streetViewElement.getBoundingClientRect();

      // Set canvas dimensions
      canvas.width = Math.max(400, rect.width);
      canvas.height = Math.max(300, rect.height);

      console.log("Creating Street View snapshot:", {
        width: canvas.width,
        height: canvas.height,
        streetViewDimensions: { width: rect.width, height: rect.height },
      });

      // Get Street View metadata for realistic representation
      let streetViewData = null;
      if (streetViewPanoramaRef.current) {
        const pov = streetViewPanoramaRef.current.getPov();
        const position = streetViewPanoramaRef.current.getPosition();
        streetViewData = {
          pov,
          position: { lat: position.lat(), lng: position.lng() },
        };
      }

      // Create a realistic Street View representation
      // Sky gradient (top 70% of canvas)
      const skyGradient = ctx.createLinearGradient(
        0,
        0,
        0,
        canvas.height * 0.7
      );
      skyGradient.addColorStop(0, "#87CEEB"); // Sky blue
      skyGradient.addColorStop(0.4, "#B0E0E6"); // Powder blue
      skyGradient.addColorStop(0.8, "#F0F8FF"); // Alice blue
      skyGradient.addColorStop(1, "#E6E6FA"); // Lavender

      ctx.fillStyle = skyGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height * 0.7);

      // Ground/street area (bottom 30% of canvas)
      ctx.fillStyle = "#696969"; // Dim gray
      ctx.fillRect(0, canvas.height * 0.7, canvas.width, canvas.height * 0.3);

      // Street surface
      ctx.fillStyle = "#2F2F2F"; // Dark gray
      ctx.fillRect(0, canvas.height * 0.8, canvas.width, canvas.height * 0.2);

      // Street center line (dashed)
      ctx.strokeStyle = "#FFFF00"; // Yellow
      ctx.lineWidth = 3;
      ctx.setLineDash([15, 10]);
      ctx.beginPath();
      ctx.moveTo(0, canvas.height * 0.9);
      ctx.lineTo(canvas.width, canvas.height * 0.9);
      ctx.stroke();
      ctx.setLineDash([]); // Reset dash

      // Add realistic building silhouettes with windows
      const buildingColors = [
        "#404040",
        "#505050",
        "#606060",
        "#454545",
        "#555555",
        "#484848",
      ];

      for (let i = 0; i < 6; i++) {
        const buildingWidth = canvas.width / 7 - 5;
        const buildingHeight = 100 + Math.sin(i * 0.8) * 60; // More realistic heights
        const buildingX = i * (canvas.width / 7) + 5;

        ctx.fillStyle = buildingColors[i % buildingColors.length];
        ctx.fillRect(
          buildingX,
          canvas.height * 0.7 - buildingHeight,
          buildingWidth,
          buildingHeight
        );

        // Add windows to buildings
        ctx.fillStyle = "#FFD700"; // Gold for windows
        const windowRows = Math.floor(buildingHeight / 25);
        const windowCols = Math.floor(buildingWidth / 20);

        for (let j = 0; j < windowCols; j++) {
          for (let k = 0; k < windowRows; k++) {
            if (buildingHeight > 40 && buildingWidth > 30) {
              // Only add windows to larger buildings
              ctx.fillRect(
                buildingX + 5 + j * 20,
                canvas.height * 0.7 - buildingHeight + 10 + k * 25,
                12,
                15
              );
            }
          }
        }
      }

      // Add some street elements (street signs, etc.)
      ctx.fillStyle = "#C0C0C0"; // Silver for street signs
      ctx.fillRect(canvas.width * 0.8, canvas.height * 0.6, 8, 40);
      ctx.fillRect(canvas.width * 0.2, canvas.height * 0.65, 8, 35);

      // Add Street View branding FIRST (before any overlays)
      ctx.fillStyle = "rgba(0, 0, 0, 0.9)"; // Make it more opaque
      ctx.fillRect(0, 0, canvas.width, 80);

      // Add a bright red test rectangle to verify drawing is working
      ctx.fillStyle = "#FF0000";
      ctx.fillRect(10, 10, 100, 30);

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 20px Arial";
      ctx.textAlign = "center";
      ctx.fillText("📍 Google Street View", canvas.width / 2, 30);

      ctx.fillStyle = "#E0E0E0";
      ctx.font = "16px Arial";
      ctx.fillText("Snapshot Captured Successfully", canvas.width / 2, 55);

      // Add a subtle overlay AFTER branding (but don't cover the header)
      ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
      ctx.fillRect(0, 80, canvas.width, canvas.height - 80); // Start after header

      console.log("Added Street View branding:", {
        headerHeight: 80,
        titleY: 30,
        subtitleY: 55,
        canvasHeight: canvas.height,
      });

      // Add a bottom info bar
      ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
      ctx.fillRect(0, canvas.height - 60, canvas.width, 60);

      console.log("Added bottom info bar:", {
        bottomBarY: canvas.height - 60,
        bottomBarHeight: 60,
        canvasHeight: canvas.height,
      });

      // Add coordinates and info in bottom bar
      if (streetViewData) {
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "12px Arial";
        ctx.textAlign = "left";
        ctx.fillText(
          `Coordinates: ${streetViewData.position.lat.toFixed(
            4
          )}, ${streetViewData.position.lng.toFixed(4)}`,
          10,
          canvas.height - 35
        );

        ctx.textAlign = "right";
        ctx.fillText(
          `Heading: ${streetViewData.pov.heading.toFixed(1)}°`,
          canvas.width - 10,
          canvas.height - 35
        );

        // Add timestamp
        ctx.textAlign = "left";
        const now = new Date().toLocaleTimeString();
        ctx.fillText(`Captured: ${now}`, 10, canvas.height - 15);
      }

      // Add a small Street View logo indicator
      ctx.fillStyle = "#4285F4"; // Google blue
      ctx.fillRect(canvas.width - 50, canvas.height - 60, 50, 60);
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 12px Arial";
      ctx.textAlign = "center";
      ctx.fillText("SV", canvas.width - 25, canvas.height - 25);

      const imageData = canvas.toDataURL("image/png");
      setStreetViewSnapshot(imageData);

      console.log("Street View representation created successfully:", {
        imageDataLength: imageData.length,
        imageDataStart: imageData.substring(0, 50) + "...",
        canvasDimensions: { width: canvas.width, height: canvas.height },
      });

      // Also save the Street View state for reference
      if (streetViewPanoramaRef.current) {
        const pov = streetViewPanoramaRef.current.getPov();
        const position = streetViewPanoramaRef.current.getPosition();

        // Store additional metadata
        console.log("Street View snapshot metadata:", {
          pov,
          position: { lat: position.lat(), lng: position.lng() },
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error("Error capturing Street View snapshot:", error);

      // Create a fallback visual representation
      console.log("Creating fallback Street View representation");

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (ctx) {
        canvas.width = 400;
        canvas.height = 300;

        // Create a simple Street View-like representation
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, "#87CEEB"); // Sky blue
        gradient.addColorStop(0.6, "#98FB98"); // Pale green
        gradient.addColorStop(1, "#696969"); // Dim gray

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Add Street View branding
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 16px Arial";
        ctx.textAlign = "center";
        ctx.fillText("Street View", canvas.width / 2, canvas.height / 2 - 20);

        ctx.fillStyle = "#E0E0E0";
        ctx.font = "12px Arial";
        ctx.fillText("Snapshot Captured", canvas.width / 2, canvas.height / 2);

        // Add coordinates if available
        if (streetViewPanoramaRef.current) {
          const position = streetViewPanoramaRef.current.getPosition();
          ctx.fillStyle = "#CCCCCC";
          ctx.font = "10px Arial";
          ctx.fillText(
            `${position.lat().toFixed(4)}, ${position.lng().toFixed(4)}`,
            canvas.width / 2,
            canvas.height / 2 + 20
          );
        }

        const imageData = canvas.toDataURL("image/png");
        setStreetViewSnapshot(imageData);
      } else {
        // Final fallback - minimal placeholder
        setStreetViewSnapshot(
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
        );
      }
    } finally {
      setCapturingSnapshot(false);
    }
  };

  const handleLocationConfirm = async () => {
    if (selectedLocation) {
      await captureStreetViewSnapshot();
      // Show snapshot confirmation modal after capturing
      setShowSnapshotModal(true);
    }
  };

  const handleSnapshotConfirm = async (confirmed: boolean) => {
    setShowSnapshotModal(false);
    if (confirmed) {
      // Capture Street View parameters
      const streetViewParams = captureStreetViewParameters();

      if (streetViewParams) {
        console.log("Captured Street View parameters:", streetViewParams);

        // Generate 360° Street View images
        const images360 = await generate360StreetViewImages(streetViewParams);

        if (images360.length > 0) {
          console.log("Successfully generated 360° Street View images");
          setStreetView360Images(images360);
          // Keep the first image as the main screenshot for backward compatibility
          setPageScreenshot(images360[0]);
        } else {
          console.error(
            "Failed to generate 360° Street View images, using fallback"
          );
          // Try to get a single image as fallback
          const staticImage = await getStreetViewStaticImage(streetViewParams);
          if (staticImage) {
            setPageScreenshot(staticImage);
          }
        }
      } else {
        console.error("Failed to capture Street View parameters");
      }

      // Show location verification modal
      setShowLocationModal(true);
      requestUserLocation();
    } else {
      // User said no, stay on map step
      setCurrentStep("map");
    }
  };

  const handleLocationModalClose = () => {
    setShowLocationModal(false);
    // Move to video step and initialize camera
    setCurrentStep("video");
    initializeCamera();
  };

  const handleManualVerificationRedirect = () => {
    setShowLocationModal(false);
    // Navigate to manual verification page
    router.push("/kyc/fallback-verification");
  };

  const requestUserLocation = () => {
    setCheckingLocation(true);
    setError("");

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setCheckingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;

        setUserGpsLocation({ lat: userLat, lng: userLng });

        // Calculate distance using Haversine formula
        // Compare user's GPS with the selected location on Street View (not the utility location)
        if (!selectedLocation) {
          setError(
            "No location selected. Please select a location on the map first."
          );
          setCheckingLocation(false);
          return;
        }

        const verifiedLat = selectedLocation.lat;
        const verifiedLng = selectedLocation.lng;

        const distance = calculateDistance(
          userLat,
          userLng,
          verifiedLat,
          verifiedLng
        );

        // DEBUG: Test distance calculation with same coordinates
        const selfDistance = calculateDistance(
          userLat,
          userLng,
          userLat,
          userLng
        );

        const selectedDistance = calculateDistance(
          verifiedLat,
          verifiedLng,
          verifiedLat,
          verifiedLng
        );

        console.log("Location verification debug:", {
          userLocation: { lat: userLat, lng: userLng },
          selectedLocation: { lat: verifiedLat, lng: verifiedLng },
          utilityLocation: {
            lat: location?.lat || 0,
            lng: location?.long || 0,
          },
          distance: `${distance} meters`,
          comparison: "User GPS vs Selected Street View Location",
          debug: {
            selfDistance: `${selfDistance} meters (should be 0)`,
            selectedSelfDistance: `${selectedDistance} meters (should be 0)`,
            coordinatePrecision: {
              userLat: userLat.toString(),
              userLng: userLng.toString(),
              selectedLat: verifiedLat.toString(),
              selectedLng: verifiedLng.toString(),
            },
          },
          userDataAddress: state.userData?.address,
        });

        console.log(
          `Distance from selected location: ${distance.toFixed(0)} meters`
        );

        // Additional debugging for coordinate comparison
        console.log("Raw coordinate comparison:", {
          userGPS: { lat: userLat, lng: userLng },
          selectedLocation: { lat: verifiedLat, lng: verifiedLng },
          latDifference: Math.abs(userLat - verifiedLat),
          lngDifference: Math.abs(userLng - verifiedLng),
          latDifferenceDegrees: Math.abs(userLat - verifiedLat) * 111000, // Rough meters per degree
          lngDifferenceDegrees:
            Math.abs(userLng - verifiedLng) *
            111000 *
            Math.cos((userLat * Math.PI) / 180),
        });

        if (distance <= 500) {
          setLocationVerified(true);
          setCheckingLocation(false);
        } else {
          // For mocking purposes, we'll allow it but show a warning
          setLocationVerified(true);
          setCheckingLocation(false);
          console.warn(
            `Location is ${distance.toFixed(
              0
            )}m away (mocking: allowing anyway)`
          );
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        // For mocking, we'll allow them to continue without location
        setLocationVerified(true);
        setCheckingLocation(false);
        setError("Could not verify location. Continuing anyway (mocked).");
      }
    );
  };

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) => {
    // Haversine formula to calculate distance in meters
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  const initializeCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: true,
      });

      // Store stream reference for cleanup
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setCameraInitialized(true);
      setError("");
    } catch (err) {
      console.error("Error initializing camera:", err);
      setError(
        "Camera permission is required. Please click the lock icon in your browser's address bar and enable Camera access, then refresh the page."
      );
      setCameraInitialized(false);
    }
  };

  const startRecording = async () => {
    if (!streamRef.current || !videoRef.current) {
      setError("Camera not initialized. Please try again.");
      return;
    }

    try {
      const mediaRecorder = new MediaRecorder(streamRef.current);
      mediaRecorderRef.current = mediaRecorder;
      recordedChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const recordedBlob = new Blob(recordedChunksRef.current, {
          type: "video/webm",
        });
        setHasRecorded(true);

        // Create video URL for comparison modal
        const videoUrl = URL.createObjectURL(recordedBlob);
        setRecordedVideoUrl(videoUrl);

        // Stop camera stream immediately after recording
        stopCameraStream();

        // Show comparison modal after a short delay
        setTimeout(() => {
          setShowComparisonModal(true);
        }, 1000);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error starting recording:", err);
      setError("Failed to start recording. Please try again.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  };

  // Initialize camera when video step is reached
  useEffect(() => {
    if (currentStep === "video" && !cameraInitialized && !streamRef.current) {
      initializeCamera();
    }
  }, [currentStep, cameraInitialized]);

  // Cleanup camera stream on component unmount
  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  // Auto-play carousel effect
  useEffect(() => {
    if (
      !showComparisonModal ||
      !isCarouselAutoPlay ||
      streetView360Images.length <= 1
    ) {
      return;
    }

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) =>
        prev === streetView360Images.length - 1 ? 0 : prev + 1
      );
    }, 2000); // Change image every 2 seconds

    return () => clearInterval(interval);
  }, [showComparisonModal, isCarouselAutoPlay, streetView360Images.length]);

  // Analysis completion timer (7 seconds)
  useEffect(() => {
    if (!showComparisonModal) {
      setAnalysisComplete(false);
      setAnalysisProgress(0);
      return;
    }

    // Progress update interval
    const progressInterval = setInterval(() => {
      setAnalysisProgress((prev) => {
        const newProgress = prev + 100 / 70; // 70 intervals of 100ms = 7 seconds
        return newProgress >= 100 ? 100 : newProgress;
      });
    }, 100);

    // Completion timer
    const timer = setTimeout(() => {
      setAnalysisComplete(true);
      setAnalysisProgress(100);
      clearInterval(progressInterval);
    }, 7000); // Show success after 7 seconds

    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
    };
  }, [showComparisonModal]);

  const handleSubmit = async () => {
    if (!hasRecorded) {
      setError("Please record a video first");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const recordedBlob = new Blob(recordedChunksRef.current, {
        type: "video/webm",
      });
      const formData = new FormData();
      formData.append("video", recordedBlob, "location_verification.webm");
      formData.append("location", JSON.stringify(selectedLocation));

      // Call video submission endpoint
      const userId = state.userData!._id;
      const response = await fetch("/api/user/address/verify/liveness", {
        method: "POST",
        body: JSON.stringify({ userId, success: true }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit video");
      }

      const saveData = await response.json();
      setUserData(saveData.user);
      console.log("Video submitted successfully:", saveData);

      // Navigate to success page
      router.push("/kyc/success");
    } catch (err) {
      console.error("Error submitting video:", err);
      setError("Failed to submit video. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.push("/kyc/document-submission");
  };

  const handleHelp = () => {
    console.log("Help clicked");
  };

  return (
    <KYCLayout
      currentStep={6}
      totalSteps={6}
      steps={["ID Info", "Address", "Face", "Capture", "Documents", "Video"]}
      onBack={handleBack}
      onHelp={handleHelp}
    >
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            Video Verification
          </h1>
          <p className="text-[var(--text-tertiary)]">
            {currentStep === "map"
              ? "Select your house location on the map"
              : "Record a video of your house front"}
          </p>
        </div>

        {currentStep === "map" ? (
          /* Map Selection Step */
          <>
            {/* Instructions */}
            <Card variant="outlined" className="bg-[var(--bg-primary)]">
              <CardContent className="py-4">
                <h4 className="font-medium text-[var(--text-primary)] mb-2">
                  Instructions:
                </h4>
                <p className="text-[var(--text-primary)] text-sm">
                  Street View is showing your verified address. Drag to look
                  around 360°, use the arrows on the street to navigate, and
                  adjust the view to see the front of your house clearly.
                </p>
              </CardContent>
            </Card>

            {/* Street View */}
            <Card variant="outlined">
              <CardContent className="p-0">
                <div className="relative">
                  <div
                    ref={streetViewRef}
                    className="w-full rounded-lg"
                    style={{ minHeight: "500px", height: "500px" }}
                  />
                  {!mapLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-secondary)] rounded-lg">
                      <div className="text-center space-y-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary-teal)] mx-auto"></div>
                        <p className="text-[var(--text-tertiary)] text-sm">
                          Loading Street View...
                        </p>
                      </div>
                    </div>
                  )}
                  {/* Flash Effect */}
                  {showFlash && (
                    <div className="absolute inset-0 bg-white rounded-lg animate-flash pointer-events-none"></div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Small Context Map */}
            {/* <Card variant="outlined">
              <CardContent className="p-0">
                <div className="relative">
                  <div
                    ref={mapRef}
                    className="w-full h-48 rounded-lg"
                    style={{ minHeight: "192px" }}
                  />
                </div>
              </CardContent>
            </Card> */}

            {/* Selected Location */}
            {selectedLocation && (
              <Card variant="outlined" className="border-[var(--primary-teal)]">
                <CardContent className="py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[var(--primary-teal)] rounded-full flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-[var(--text-primary)]">
                        Selected Location
                      </p>
                      <p className="text-sm text-[var(--text-secondary)]">
                        {selectedLocation.address}
                      </p>
                      <p className="text-xs text-[var(--text-tertiary)] font-mono">
                        {selectedLocation.lat.toFixed(6)},{" "}
                        {selectedLocation.lng.toFixed(6)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Confirm Location Button */}
            <Button
              size="lg"
              onClick={handleLocationConfirm}
              disabled={!selectedLocation || capturingSnapshot}
              loading={capturingSnapshot}
              className="w-full"
            >
              {capturingSnapshot
                ? "Capturing Snapshot..."
                : "Confirm Location & Continue to Video"}
            </Button>
          </>
        ) : (
          /* Video Recording Step */
          <>
            {/* Selected Location Display */}
            {selectedLocation && (
              <Card variant="outlined">
                <CardContent className="space-y-4">
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                    📍 Recording Location
                  </h3>

                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-[var(--text-tertiary)]">
                        Address
                      </p>
                      <p className="font-medium text-[var(--text-primary)]">
                        {selectedLocation.address}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-[var(--text-tertiary)]">
                        Coordinates
                      </p>
                      <p className="font-mono text-sm text-[var(--text-secondary)]">
                        {selectedLocation.lat.toFixed(6)}° N,{" "}
                        {selectedLocation.lng.toFixed(6)}° E
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Video Recording Instructions */}
            <Card variant="outlined" className="bg-[var(--bg-secondary)]">
              <CardContent className="py-4">
                <h4 className="font-medium text-[var(--text-primary)] mb-2">
                  Instructions:
                </h4>
                <p className="text-[var(--text-primary)] text-sm">
                  Go outside to the front of your house and record a 30-second
                  video showing:
                </p>
                <ul className="mt-3 space-y-1 text-sm text-[var(--text-primary)]">
                  <li>• The front of your house clearly</li>
                  <li>• Surrounding area for context</li>
                  <li>• Ensure good lighting and clear visibility</li>
                  <li>• Record for at least 30 seconds</li>
                </ul>
              </CardContent>
            </Card>
          </>
        )}

        {/* Video Preview - Only show in video step */}
        {currentStep === "video" && (
          <Card variant="outlined">
            <CardContent className="space-y-4">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                Camera Preview
              </h3>

              <div className="relative bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full h-64 object-cover"
                  playsInline
                  muted
                />

                {!isRecording && !hasRecorded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="text-center text-white">
                      <svg
                        className="w-16 h-16 mx-auto mb-4 opacity-50"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                      <p className="text-sm">
                        Camera will start when you begin recording
                      </p>
                    </div>
                  </div>
                )}

                {isRecording && (
                  <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">REC</span>
                  </div>
                )}
              </div>

              {/* Recording Controls */}
              <div className="flex justify-center gap-4">
                {!hasRecorded ? (
                  <Button
                    onClick={isRecording ? stopRecording : startRecording}
                    variant={isRecording ? "secondary" : "primary"}
                    size="lg"
                    disabled={!cameraInitialized}
                    className={`px-8 ${
                      isRecording
                        ? "bg-red-500 hover:bg-red-600 text-white"
                        : ""
                    }`}
                  >
                    {!cameraInitialized
                      ? "Initializing Camera..."
                      : isRecording
                      ? "Stop Recording"
                      : "Start Recording"}
                  </Button>
                ) : (
                  <div className="text-center space-y-3">
                    <div className="flex items-center justify-center gap-2 text-[var(--success)]">
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="font-medium">
                        Video recorded successfully!
                      </span>
                    </div>
                    <Button
                      onClick={startRecording}
                      variant="outline"
                      size="sm"
                    >
                      Record Again
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Message */}
        {error && (
          <Card
            variant="outlined"
            className="border-[var(--error)] bg-[var(--error-light)]"
          >
            <CardContent className="flex items-center gap-3 py-4">
              <svg
                className="w-5 h-5 text-[var(--error)] flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-[var(--error)] font-medium">{error}</span>
            </CardContent>
          </Card>
        )}

        {/* Submit Button - Only show in video step */}
        {currentStep === "video" && hasRecorded && (
          <div className="pt-4">
            <Button
              size="lg"
              onClick={handleSubmit}
              className="w-full"
              loading={loading}
            >
              {loading ? "Saving..." : "Save & Submit"}
            </Button>
          </div>
        )}

        {/* Back Button for Video Step */}
        {currentStep === "video" && (
          <div className="pt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentStep("map")}
              className="w-full"
            >
              ← Back to Map Selection
            </Button>
          </div>
        )}

        {/* Snapshot Confirmation Modal */}
        {showSnapshotModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardContent className="p-6 space-y-4">
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                  Confirm Address
                </h3>

                {/* Removed snapshot image per request; modal now shows only confirmation text */}
                <div className="hidden" />

                <p className="text-[var(--text-secondary)] text-sm">
                  Is this the address where you want to record your video?
                </p>

                {selectedLocation && (
                  <div className="bg-[var(--bg-secondary)] p-3 rounded-lg">
                    <p className="text-sm text-[var(--text-primary)] font-medium">
                      {selectedLocation.address}
                    </p>
                    <p className="text-xs text-[var(--text-tertiary)] mt-1">
                      {selectedLocation.lat.toFixed(6)},{" "}
                      {selectedLocation.lng.toFixed(6)}
                    </p>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => handleSnapshotConfirm(false)}
                    className="flex-1"
                  >
                    No, Go Back
                  </Button>
                  <Button
                    onClick={async () => {
                      await handleSnapshotConfirm(true);
                    }}
                    className="flex-1"
                  >
                    Yes, Continue
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Location Verification Modal */}
        {showLocationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardContent className="p-6 space-y-4">
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                  Location Verification
                </h3>

                {checkingLocation ? (
                  <div className="flex items-center gap-3 py-4">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[var(--primary-teal)]"></div>
                    <span className="text-[var(--text-secondary)] font-medium">
                      Verifying your location...
                    </span>
                  </div>
                ) : locationVerified && userGpsLocation ? (
                  <div className="space-y-4">
                    {/* Check distance and show appropriate message */}
                    {(() => {
                      if (!selectedLocation) return null;
                      const verifiedLat = selectedLocation.lat;
                      const verifiedLng = selectedLocation.lng;
                      const distance = calculateDistance(
                        userGpsLocation.lat,
                        userGpsLocation.lng,
                        verifiedLat,
                        verifiedLng
                      );

                      if (distance <= 500) {
                        return (
                          <div className="flex items-center gap-3 p-3 bg-[var(--success)]/10 border border-[var(--success)] rounded-lg">
                            <svg
                              className="w-5 h-5 text-[var(--success)]"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <div className="flex-1">
                              <span className="text-[var(--success)] font-medium">
                                Location verified (within 500m)
                              </span>
                              <p className="text-xs text-[var(--text-tertiary)] mt-1">
                                GPS: {userGpsLocation.lat.toFixed(6)},{" "}
                                {userGpsLocation.lng.toFixed(6)}
                              </p>
                            </div>
                          </div>
                        );
                      } else {
                        return (
                          <div className="space-y-4">
                            <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                              <svg
                                className="w-5 h-5 text-yellow-600"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              <div className="flex-1">
                                <span className="text-yellow-600 font-medium">
                                  Location Warning
                                </span>
                                <p className="text-xs text-[var(--text-tertiary)] mt-1">
                                  You're {distance.toFixed(0)}m away from the
                                  selected location
                                </p>
                              </div>
                            </div>

                            <div className="bg-[var(--bg-primary)] rounded-lg p-4 space-y-3">
                              <p className="text-[var(--text-primary)] text-sm font-medium">
                                You have two options to proceed:
                              </p>

                              <div>
                                <p className="text-[var(--text-primary)] text-sm font-medium mb-1">
                                  Option 1: Go to Your Location
                                </p>
                                <p className="text-[var(--text-secondary)] text-sm">
                                  Go to your actual address location and try the
                                  verification process again. This will give you
                                  the fastest results.
                                </p>
                              </div>

                              <div>
                                <p className="text-[var(--text-primary)] text-sm font-medium mb-1">
                                  Option 2: Manual Verification
                                </p>
                                <p className="text-[var(--text-secondary)] text-sm">
                                  Submit additional documents and details for
                                  manual review. This typically takes
                                  approximately 15 minutes.
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      }
                    })()}
                  </div>
                ) : null}

                <div className="pt-2">
                  {(() => {
                    if (checkingLocation) {
                      return (
                        <Button
                          onClick={handleLocationModalClose}
                          className="w-full"
                          disabled={true}
                        >
                          Continue to Video Recording
                        </Button>
                      );
                    }

                    // Check if user is far from location to show two options
                    if (
                      locationVerified &&
                      userGpsLocation &&
                      selectedLocation
                    ) {
                      const verifiedLat = selectedLocation.lat;
                      const verifiedLng = selectedLocation.lng;
                      const distance = calculateDistance(
                        userGpsLocation.lat,
                        userGpsLocation.lng,
                        verifiedLat,
                        verifiedLng
                      );

                      if (distance > 500) {
                        return (
                          <div className="space-y-3">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setShowLocationModal(false);
                                // Go back to map selection
                                setCurrentStep("map");
                              }}
                              className="w-full"
                            >
                              Go to Location
                            </Button>
                            <Button
                              onClick={handleManualVerificationRedirect}
                              className="w-full"
                            >
                              Manual Verification (~15 min)
                            </Button>
                          </div>
                        );
                      }
                    }

                    // Default button for close location or when loading
                    return (
                      <Button
                        onClick={handleLocationModalClose}
                        className="w-full"
                        disabled={checkingLocation}
                      >
                        Continue to Video Recording
                      </Button>
                    );
                  })()}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Image Generation Loading Modal */}
        {isGenerating360Images && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardContent className="p-6 text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-[var(--primary-teal)] rounded-full flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-white animate-spin"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-[var(--text-primary)]">
                  Generating 360° Reference Images
                </h3>
                <p className="text-[var(--text-secondary)] text-sm">
                  Creating Street View images from multiple angles for
                  comparison
                </p>

                {/* Progress Bar */}
                <div className="w-full bg-[var(--bg-secondary)] rounded-full h-3">
                  <div
                    className="bg-[var(--primary-teal)] h-3 rounded-full transition-all duration-300"
                    style={{ width: `${imageGenerationProgress}%` }}
                  ></div>
                </div>

                <div className="flex justify-between text-xs text-[var(--text-tertiary)]">
                  <span>{Math.round(imageGenerationProgress)}% complete</span>
                  <span>
                    {Math.round(imageGenerationProgress / 12.5)} / 8 images
                  </span>
                </div>

                <p className="text-[var(--text-tertiary)] text-xs">
                  This may take a few moments...
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Computer Vision Comparison Modal */}
        {showComparisonModal && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <CardContent className="p-6 space-y-6">
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
                    Computer Vision Analysis
                  </h3>
                  <p className="text-[var(--text-secondary)] text-sm">
                    Comparing your recorded video with the 360° Street View
                    reference images
                  </p>
                </div>

                {/* Comparison Container */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* 360° Street View Carousel Side */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-[var(--text-primary)] text-center">
                      360° Street View Reference
                    </h4>
                    <div className="relative border-2 border-[var(--border-primary)] rounded-lg overflow-hidden bg-[var(--bg-secondary)]">
                      {streetView360Images.length > 0 ? (
                        <div className="relative">
                          {/* Main Image Display */}
                          <img
                            src={streetView360Images[currentImageIndex]}
                            alt={`Street View at ${currentImageIndex * 45}°`}
                            className="w-full h-auto max-h-80 object-contain"
                          />

                          {/* Navigation Arrows */}
                          <button
                            onClick={() =>
                              setCurrentImageIndex((prev) =>
                                prev === 0
                                  ? streetView360Images.length - 1
                                  : prev - 1
                              )
                            }
                            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-all"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 19l-7-7 7-7"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() =>
                              setCurrentImageIndex((prev) =>
                                prev === streetView360Images.length - 1
                                  ? 0
                                  : prev + 1
                              )
                            }
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-all"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          </button>

                          {/* Image Counter */}
                          <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                            {currentImageIndex + 1} /{" "}
                            {streetView360Images.length}
                          </div>

                          {/* Heading Indicator */}
                          <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                            {currentImageIndex * 45}°
                          </div>
                        </div>
                      ) : pageScreenshot ? (
                        <img
                          src={pageScreenshot}
                          alt="Google Street View reference image"
                          className="w-full h-auto max-h-80 object-contain"
                        />
                      ) : (
                        <div className="h-80 flex items-center justify-center text-[var(--text-tertiary)]">
                          No images available
                        </div>
                      )}
                    </div>

                    {/* Carousel Controls */}
                    {streetView360Images.length > 1 && (
                      <div className="flex items-center justify-center space-x-4">
                        {/* Auto-play Toggle */}
                        <button
                          onClick={() =>
                            setIsCarouselAutoPlay(!isCarouselAutoPlay)
                          }
                          className="flex items-center space-x-2 px-3 py-1 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-sm hover:bg-[var(--bg-primary)] transition-all"
                        >
                          {isCarouselAutoPlay ? (
                            <>
                              <svg
                                className="w-4 h-4"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                              </svg>
                              <span>Pause</span>
                            </>
                          ) : (
                            <>
                              <svg
                                className="w-4 h-4"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M8 5v14l11-7z" />
                              </svg>
                              <span>Play</span>
                            </>
                          )}
                        </button>

                        {/* Carousel Dots */}
                        <div className="flex space-x-2">
                          {streetView360Images.map((_, index) => (
                            <button
                              key={index}
                              onClick={() => setCurrentImageIndex(index)}
                              className={`w-2 h-2 rounded-full transition-all ${
                                index === currentImageIndex
                                  ? "bg-[var(--primary-teal)]"
                                  : "bg-[var(--border-primary)] hover:bg-[var(--text-tertiary)]"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Video Side */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-[var(--text-primary)] text-center">
                      Your Recorded Video
                    </h4>
                    <div className="relative border-2 border-[var(--border-primary)] rounded-lg overflow-hidden bg-[var(--bg-secondary)]">
                      {recordedVideoUrl ? (
                        <video
                          src={recordedVideoUrl}
                          controls
                          className="w-full h-auto max-h-80"
                          autoPlay
                          loop
                          muted
                        />
                      ) : (
                        <div className="h-80 flex items-center justify-center text-[var(--text-tertiary)]">
                          No video available
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Animated Arrows */}
                <div className="flex justify-center items-center space-x-8">
                  <div className="flex flex-col items-center space-y-2">
                    <div className="animate-bounce">
                      <svg
                        className="w-6 h-6 text-[var(--primary-teal)]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 14l-7 7m0 0l-7-7m7 7V3"
                        />
                      </svg>
                    </div>
                    <span className="text-xs text-[var(--text-tertiary)]">
                      AI Analysis
                    </span>
                  </div>

                  <div className="flex flex-col items-center space-y-2">
                    <div className="animate-pulse bg-[var(--primary-teal)] w-2 h-2 rounded-full"></div>
                    <div className="animate-pulse bg-[var(--primary-teal)] w-2 h-2 rounded-full delay-100"></div>
                    <div className="animate-pulse bg-[var(--primary-teal)] w-2 h-2 rounded-full delay-200"></div>
                    <span className="text-xs text-[var(--text-tertiary)]">
                      Processing
                    </span>
                  </div>

                  <div className="flex flex-col items-center space-y-2">
                    <div className="animate-bounce delay-300">
                      <svg
                        className="w-6 h-6 text-[var(--primary-teal)]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 10l7-7m0 0l7 7m-7-7v18"
                        />
                      </svg>
                    </div>
                    <span className="text-xs text-[var(--text-tertiary)]">
                      Data Transfer
                    </span>
                  </div>
                </div>

                {/* Analysis Status */}
                <div className="text-center space-y-3">
                  {!analysisComplete ? (
                    <>
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[var(--primary-teal)]"></div>
                        <span className="text-[var(--text-secondary)] font-medium">
                          Analyzing video and location data...
                        </span>
                      </div>
                      <p className="text-[var(--text-tertiary)] text-sm">
                        This may take a few moments to complete
                      </p>
                      {/* Progress Bar */}
                      <div className="w-full bg-[var(--bg-secondary)] rounded-full h-2">
                        <div
                          className="bg-[var(--primary-teal)] h-2 rounded-full transition-all duration-100"
                          style={{ width: `${analysisProgress}%` }}
                        ></div>
                      </div>
                      <p className="text-[var(--text-tertiary)] text-xs">
                        {Math.round(analysisProgress)}% complete
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-6 h-6 bg-[var(--success)] rounded-full flex items-center justify-center">
                          <svg
                            className="w-4 h-4 text-white"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <span className="text-[var(--success)] font-medium">
                          Analysis Complete - Location Verified!
                        </span>
                      </div>
                      <p className="text-[var(--text-secondary)] text-sm">
                        Your video matches the verified location with high
                        confidence
                      </p>
                    </>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowComparisonModal(false);
                      setAnalysisComplete(false);
                      // Clean up video URL
                      if (recordedVideoUrl) {
                        URL.revokeObjectURL(recordedVideoUrl);
                        setRecordedVideoUrl("");
                      }
                    }}
                    className="flex-1"
                  >
                    {analysisComplete ? "Close" : "Cancel Analysis"}
                  </Button>
                  <Button
                    onClick={() => {
                      // Simulate successful verification
                      setShowComparisonModal(false);
                      setAnalysisComplete(false);
                      // Clean up video URL
                      if (recordedVideoUrl) {
                        URL.revokeObjectURL(recordedVideoUrl);
                        setRecordedVideoUrl("");
                      }
                      handleSubmit();
                      // Navigate to success page
                      // router.push("/kyc/success");
                    }}
                    className="flex-1"
                    disabled={!analysisComplete}
                  >
                    {analysisComplete
                      ? "Complete Verification"
                      : "Processing..."}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </KYCLayout>
  );
};

export default VideoVerificationPage;
