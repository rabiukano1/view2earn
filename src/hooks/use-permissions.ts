import { useState, useEffect, useCallback } from 'react';
import { Alert, Linking, Platform } from 'react-native';
import { useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { AudioModule } from 'expo-audio';

type PermissionType = 'camera' | 'microphone' | 'location' | 'audio';

type PermissionState = {
  camera: boolean;
  microphone: boolean;
  location: boolean;
  audio: boolean;
};

export function usePermissions() {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null);
  const [audioPermission, setAudioPermission] = useState<boolean | null>(null);

  const requestLocation = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    const granted = status === 'granted';
    setLocationPermission(granted);
    return granted;
  }, []);

  const requestAudio = useCallback(async () => {
    const { granted } = await AudioModule.requestRecordingPermissionsAsync();
    setAudioPermission(granted);
    return granted;
  }, []);

  const requestMicrophone = useCallback(async () => {
    if (cameraPermission) {
      if (cameraPermission.granted) return true;
      const result = await requestCameraPermission();
      return result.granted;
    }
    return false;
  }, [cameraPermission, requestCameraPermission]);

  const checkPermission = useCallback(async (type: PermissionType) => {
    switch (type) {
      case 'camera': {
        if (!cameraPermission) return false;
        if (cameraPermission.granted) return true;
        const result = await requestCameraPermission();
        return result.granted;
      }
      case 'microphone':
        return requestMicrophone();
      case 'location':
        return requestLocation();
      case 'audio':
        return requestAudio();
    }
  }, [cameraPermission, requestCameraPermission, requestMicrophone, requestLocation, requestAudio]);

  const requestPermission = useCallback(async (
    type: PermissionType,
    rationale?: string
  ) => {
    const granted = await checkPermission(type);
    if (!granted && rationale) {
      Alert.alert(
        'Permission Required',
        rationale,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      );
    }
    return granted;
  }, [checkPermission]);

  useEffect(() => {
    if (locationPermission === null) {
      Location.getForegroundPermissionsAsync().then(({ granted }) => {
        setLocationPermission(granted);
      });
    }
  }, [locationPermission]);

  useEffect(() => {
    if (audioPermission === null) {
      AudioModule.getRecordingPermissionsAsync().then(({ granted }) => {
        setAudioPermission(granted);
      });
    }
  }, [audioPermission]);

  const permissions: PermissionState = {
    camera: cameraPermission?.granted ?? false,
    microphone: cameraPermission?.granted ?? false,
    location: locationPermission ?? false,
    audio: audioPermission ?? false,
  };

  return { permissions, requestPermission, checkPermission };
}
