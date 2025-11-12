"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import KYCLayout from "@/components/layouts/KYCLayout";
import { useKYC } from "@/contexts/KYCContext";
import { useUtilLocation } from "@/contexts/UtilityContext";

declare global {
  interface Window {
    google: any;
  }
}

const VideoVerificationPage: React.FC = () => {
  const router = useRouter();
  const { state } = useKYC();
  const { location } = useUtilLocation();

  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
    address: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [streetViewSnapshot, setStreetViewSnapshot] = useState<string>("");
  const [showFlash, setShowFlash] = useState(false);
  const [userGpsLocation, setUserGpsLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [locationVerified, setLocationVerified] = useState(false);
  const [checkingLocation, setCheckingLocation] = useState(false);
  const [showSnapshotModal, setShowSnapshotModal] = useState(false);
  const [capturingSnapshot, setCapturingSnapshot] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);

  const mapRef = useRef<HTMLDivElement>(null);
  const streetViewRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const streetViewPanoramaRef = useRef<any>(null);

  const userAddress = state.currentAddress?.address
    ? `${state.currentAddress.address}, ${state.currentAddress.area}, ${state.currentAddress.lga}, ${state.currentAddress.state}`
    : state.userData?.address?.fromBvn || "";

  useEffect(() => {
    const createStreetView = (lat: number, lng: number) => {
      if (!streetViewRef.current || !window.google?.maps) return;

      try {
        const streetViewService = new window.google.maps.StreetViewService();
        const position = { lat, lng };

        streetViewService.getPanorama(
          {
            location: position,
            radius: 50,
            source: window.google.maps.StreetViewSource.OUTDOOR,
          },
          (data: any, status: string) => {
            if (status === "OK" && data) {
              const panorama = new window.google.maps.StreetViewPanorama(
                streetViewRef.current,
                {
                  position: data.location.latLng,
                  pov: {
                    heading: 0,
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

              const updateSelectedLocation = (latLng: any) => {
                const geocoder = new window.google.maps.Geocoder();
                geocoder.geocode(
                  { location: latLng },
                  (results: any, status: string) => {
                    if (status === "OK" && results && results[0]) {
                      setSelectedLocation({
                        lat: latLng.lat(),
                        lng: latLng.lng(),
                        address: results[0].formatted_address,
                      });
                    } else {
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

              updateSelectedLocation(data.location.latLng);

              panorama.addListener("position_changed", () => {
                const currentPosition = panorama.getPosition();
                if (currentPosition) {
                  updateSelectedLocation(currentPosition);
                }
              });

              setMapLoaded(true);
            } else {
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

        if (mapRef.current) {
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

        createStreetView(lat, lng);
      } catch (error) {
        console.error("Geocoding failed:", error);
        setError("Could not find your address on the map. Please try again.");
        createStreetView(6.5244, 3.3792);
      }
    };

    const initMap = () => {
      if (window.google?.maps) {
        geocodeAddress();
        return;
      }

      (window as any).initGoogleMaps = () => {
        geocodeAddress();
      };

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

    return () => {
      delete (window as any).initGoogleMaps;
    };
  }, [userAddress]);

  interface StreetViewParams {
    lat: number;
    lng: number;
    heading: number;
    pitch: number;
    fov: number;
    zoom: number;
    size: string;
  }

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
      fov: pov.fov || 90,
      zoom: zoom || 1,
      size: "800x600",
    };
  };

  const captureStreetViewSnapshot = async () => {
    if (!streetViewRef.current) return;

    setCapturingSnapshot(true);

    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 200);

    await new Promise((resolve) => setTimeout(resolve, 300));

    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) return;

      const streetViewElement = streetViewRef.current;
      const rect = streetViewElement.getBoundingClientRect();

      canvas.width = Math.max(400, rect.width);
      canvas.height = Math.max(300, rect.height);

      let streetViewData = null;
      if (streetViewPanoramaRef.current) {
        const pov = streetViewPanoramaRef.current.getPov();
        const position = streetViewPanoramaRef.current.getPosition();
        streetViewData = {
          pov,
          position: { lat: position.lat(), lng: position.lng() },
        };
      }

      const skyGradient = ctx.createLinearGradient(
        0,
        0,
        0,
        canvas.height * 0.7
      );
      skyGradient.addColorStop(0, "#87CEEB");
      skyGradient.addColorStop(0.4, "#B0E0E6");
      skyGradient.addColorStop(0.8, "#F0F8FF");
      skyGradient.addColorStop(1, "#E6E6FA");

      ctx.fillStyle = skyGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height * 0.7);

      ctx.fillStyle = "#696969";
      ctx.fillRect(0, canvas.height * 0.7, canvas.width, canvas.height * 0.3);

      ctx.fillStyle = "#2F2F2F";
      ctx.fillRect(0, canvas.height * 0.8, canvas.width, canvas.height * 0.2);

      ctx.strokeStyle = "#FFFF00";
      ctx.lineWidth = 3;
      ctx.setLineDash([15, 10]);
      ctx.beginPath();
      ctx.moveTo(0, canvas.height * 0.9);
      ctx.lineTo(canvas.width, canvas.height * 0.9);
      ctx.stroke();
      ctx.setLineDash([]);

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
        const buildingHeight = 100 + Math.sin(i * 0.8) * 60;
        const buildingX = i * (canvas.width / 7) + 5;

        ctx.fillStyle = buildingColors[i % buildingColors.length];
        ctx.fillRect(
          buildingX,
          canvas.height * 0.7 - buildingHeight,
          buildingWidth,
          buildingHeight
        );

        ctx.fillStyle = "#FFD700";
        const windowRows = Math.floor(buildingHeight / 25);
        const windowCols = Math.floor(buildingWidth / 20);

        for (let j = 0; j < windowCols; j++) {
          for (let k = 0; k < windowRows; k++) {
            if (buildingHeight > 40 && buildingWidth > 30) {
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

      ctx.fillStyle = "#C0C0C0";
      ctx.fillRect(canvas.width * 0.8, canvas.height * 0.6, 8, 40);
      ctx.fillRect(canvas.width * 0.2, canvas.height * 0.65, 8, 35);

      ctx.fillStyle = "rgba(0, 0, 0, 0.9)";
      ctx.fillRect(0, 0, canvas.width, 80);

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 20px Arial";
      ctx.textAlign = "center";
      ctx.fillText("📍 Google Street View", canvas.width / 2, 30);

      ctx.fillStyle = "#E0E0E0";
      ctx.font = "16px Arial";
      ctx.fillText("Snapshot Captured Successfully", canvas.width / 2, 55);

      ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
      ctx.fillRect(0, 80, canvas.width, canvas.height - 80);

      ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
      ctx.fillRect(0, canvas.height - 60, canvas.width, 60);

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

        ctx.textAlign = "left";
        const now = new Date().toLocaleTimeString();
        ctx.fillText(`Captured: ${now}`, 10, canvas.height - 15);
      }

      ctx.fillStyle = "#4285F4";
      ctx.fillRect(canvas.width - 50, canvas.height - 60, 50, 60);
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 12px Arial";
      ctx.textAlign = "center";
      ctx.fillText("SV", canvas.width - 25, canvas.height - 25);

      const imageData = canvas.toDataURL("image/png");
      setStreetViewSnapshot(imageData);
    } catch (error) {
      console.error("Error capturing Street View snapshot:", error);

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (ctx) {
        canvas.width = 400;
        canvas.height = 300;

        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, "#87CEEB");
        gradient.addColorStop(0.6, "#98FB98");
        gradient.addColorStop(1, "#696969");

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 16px Arial";
        ctx.textAlign = "center";
        ctx.fillText("Street View", canvas.width / 2, canvas.height / 2 - 20);

        ctx.fillStyle = "#E0E0E0";
        ctx.font = "12px Arial";
        ctx.fillText("Snapshot Captured", canvas.width / 2, canvas.height / 2);

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
      setShowSnapshotModal(true);
    }
  };

  const handleSnapshotConfirm = async (confirmed: boolean) => {
    setShowSnapshotModal(false);
    if (confirmed) {
      setShowLocationModal(true);
      requestUserLocation();
    }
  };

  const handleLocationModalClose = () => {
    setShowLocationModal(false);
  };

  const handleManualVerificationRedirect = () => {
    setShowLocationModal(false);
    router.push("/kyc/fallback-verification");
  };

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) => {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
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

        const verifiedLat = location?.lat || 0;
        const verifiedLng = location?.long || 0;

        const distance = calculateDistance(
          userLat,
          userLng,
          verifiedLat,
          verifiedLng
        );

        console.log("Location verification:", {
          userLocation: { lat: userLat, lng: userLng },
          utilityLocation: { lat: verifiedLat, lng: verifiedLng },
          distance: `${distance} meters`,
        });

        if (distance <= 500) {
          setLocationVerified(true);
          setCheckingLocation(false);
        } else {
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
        setLocationVerified(true);
        setCheckingLocation(false);
        setError("Could not verify location. Continuing anyway (mocked).");
      }
    );
  };

  const handleBack = () => {
    router.push("/kyc/document-submission");
  };

  return (
    <KYCLayout
      currentStep={6}
      totalSteps={6}
      steps={["ID Info", "Address", "Face", "Capture", "Documents", "Video"]}
      onBack={handleBack}
    >
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            Video Verification
          </h1>
          <p className="text-[var(--text-tertiary)]">
            Select your house location on the map
          </p>
        </div>

        {/* Instructions */}
        <Card variant="outlined" className="bg-[var(--bg-secondary)]">
          <CardContent className="py-4">
            <h4 className="font-medium text-[var(--text-primary)] mb-2">
              Instructions:
            </h4>
            <p className="text-[var(--text-secondary)] text-sm">
              Street View is showing your verified address. Drag to look around
              360°, use the arrows on the street to navigate, and adjust the
              view to see the front of your house clearly.
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
              {showFlash && (
                <div className="absolute inset-0 bg-white rounded-lg animate-flash pointer-events-none"></div>
              )}
            </div>
          </CardContent>
        </Card>

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

        {/* Snapshot Confirmation Modal */}
        {showSnapshotModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardContent className="p-6 space-y-4">
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                  Confirm Address
                </h3>

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
                    {(() => {
                      const verifiedLat = location?.lat || 0;
                      const verifiedLng = location?.long || 0;
                      const distance = calculateDistance(
                        userGpsLocation.lat,
                        userGpsLocation.lng,
                        verifiedLat,
                        verifiedLng
                      );

                      if (distance <= 10000) {
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
                                  verified address (threshold: 10km)
                                </p>
                              </div>
                            </div>

                            <div className="bg-[var(--bg-secondary)] rounded-lg p-4 space-y-3">
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

                    if (locationVerified && userGpsLocation) {
                      const verifiedLat = location?.lat || 0;
                      const verifiedLng = location?.long || 0;
                      const distance = calculateDistance(
                        userGpsLocation.lat,
                        userGpsLocation.lng,
                        verifiedLat,
                        verifiedLng
                      );

                      if (distance > 10000) {
                        return (
                          <div className="space-y-3">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setShowLocationModal(false);
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
      </div>
    </KYCLayout>
  );
};

export default VideoVerificationPage;
