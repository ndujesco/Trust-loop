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
        <Button size="lg" className="w-full" disabled={!selectedLocation}>
          Confirm Location & Continue to Video
        </Button>
      </div>
    </KYCLayout>
  );
};

export default VideoVerificationPage;
