import { House } from "lucide-react-native";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import MapView, { Marker } from "react-native-maps";

import { colors } from "@/constants/colors";

import type { ShelterMapProps } from "@/components/maps/types";

const mapStyle = [
  {
    elementType: "geometry",
    stylers: [{ color: "#191B1E" }],
  },
  {
    elementType: "labels.text.fill",
    stylers: [{ color: "#B5BABF" }],
  },
  {
    elementType: "labels.text.stroke",
    stylers: [{ color: "#191B1E" }],
  },
  {
    featureType: "poi",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "transit",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#35393E" }],
  },
  {
    featureType: "road",
    elementType: "labels.icon",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#10151B" }],
  },
];

const METRES_PER_LATITUDE_DEGREE = 111_320;

const MINIMUM_VISIBLE_HEIGHT_METRES = 100;

const EDGE_PADDING = 40;

export default function ShelterMap({ shelter, userLocation }: ShelterMapProps) {
  const [mapSize, setMapSize] = useState({
    width: 320,
    height: 210,
  });

  const latitude = userLocation
    ? (shelter.latitude + userLocation.latitude) / 2
    : shelter.latitude;

  const longitude = userLocation
    ? (shelter.longitude + userLocation.longitude) / 2
    : shelter.longitude;

  const latitudeDifference = userLocation
    ? Math.abs(shelter.latitude - userLocation.latitude)
    : 0;

  const longitudeDifference = userLocation
    ? Math.abs(shelter.longitude - userLocation.longitude)
    : 0;

  const aspectRatio = mapSize.width / mapSize.height;

  // En longitudgrad motsvarar olika många meter
  // beroende på hur långt norrut kartan ligger.
  const latitudeCorrection = Math.max(
    0.01,
    Math.cos((latitude * Math.PI) / 180),
  );

  const usableWidth = Math.max(1, mapSize.width - EDGE_PADDING * 2);

  const usableHeight = Math.max(1, mapSize.height - EDGE_PADDING * 2);

  const horizontalFraction = usableWidth / mapSize.width;
  const verticalFraction = usableHeight / mapSize.height;

  const minimumLatitudeDelta =
    MINIMUM_VISIBLE_HEIGHT_METRES / METRES_PER_LATITUDE_DEGREE;

  // Ta hänsyn till både nord–sydligt och öst–västligt
  // avstånd, så att båda punkterna får plats.
  const latitudeDelta = Math.max(
    latitudeDifference / verticalFraction,
    (longitudeDifference * latitudeCorrection) /
      aspectRatio /
      horizontalFraction,
    minimumLatitudeDelta,
  );

  const longitudeDelta = (latitudeDelta * aspectRatio) / latitudeCorrection;

  return (
    <View
      style={styles.container}
      onLayout={({ nativeEvent }) => {
        const { width, height } = nativeEvent.layout;

        if (width <= 0 || height <= 0) return;

        setMapSize((current) => {
          if (current.width === width && current.height === height) {
            return current;
          }

          return { width, height };
        });
      }}
    >
      <MapView
        style={styles.map}
        region={{
          latitude,
          longitude,
          latitudeDelta,
          longitudeDelta,
        }}
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        showsCompass={false}
        showsScale={false}
        showsBuildings={false}
        showsPointsOfInterests={false}
        customMapStyle={mapStyle}
        userInterfaceStyle="dark"
        toolbarEnabled={false}
        moveOnMarkerPress={false}
      >
        {userLocation && (
          <Marker
            coordinate={userLocation}
            title="Din position"
            anchor={{ x: 0.5, y: 0.5 }}
            zIndex={1}
          >
            <View style={styles.locationHalo}>
              <View style={styles.locationDot} />
            </View>
          </Marker>
        )}

        <Marker
          coordinate={shelter}
          title="Skyddsrum"
          anchor={{ x: 0.5, y: 0.5 }}
          zIndex={2}
        >
          <View style={styles.shelterMarker}>
            <House size={16} color={colors.surface} strokeWidth={2} />
          </View>
        </Marker>
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 210,
    overflow: "hidden",
    borderRadius: 10,
    backgroundColor: "#191B1E",
  },

  map: {
    flex: 1,
  },

  shelterMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.surface,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  locationHalo: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(89, 166, 224, 0.22)",
    alignItems: "center",
    justifyContent: "center",
  },

  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.surface,
    backgroundColor: "#59A6E0",
  },
});
