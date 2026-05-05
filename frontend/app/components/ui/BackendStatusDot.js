/**
 * BackendStatusDot
 *
 * A small indicator dot that pings a backend and shows connection status.
 *   🟢 green  = backend reachable
 *   🔴 red    = unreachable
 *   ⚪ grey   = checking (initial state)
 *
 * Usage:
 *   <BackendStatusDot backendKey="photoSpelling" />
 *   <BackendStatusDot backendKey="writingMath" label />
 */

import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { getBackendUrl } from '../../services/apiHub';

const STATUS = { CHECKING: 'checking', ONLINE: 'online', OFFLINE: 'offline' };

const COLORS = {
  [STATUS.CHECKING]: '#9CA3AF',
  [STATUS.ONLINE]: '#22C55E',
  [STATUS.OFFLINE]: '#EF4444',
};

const LABELS = {
  [STATUS.CHECKING]: 'Checking...',
  [STATUS.ONLINE]: 'Backend Connected',
  [STATUS.OFFLINE]: 'Backend Offline',
};

const PING_INTERVAL_MS = 60_000; // re-check every 60 s

const BackendStatusDot = ({ backendKey, label = false, style }) => {
  const [status, setStatus] = useState(STATUS.CHECKING);
  const pulse = useRef(new Animated.Value(1)).current;

  const ping = async () => {
    try {
      const baseUrl = getBackendUrl(backendKey);
      
      // Skip status check for actions backend (no /health endpoint, tested via actual API calls)
      if (backendKey === 'actions') {
        console.log(`[BackendStatusDot] ${backendKey} - skipping health check (tested via API calls)`);
        setStatus(STATUS.ONLINE);
        return;
      }
      
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 90000); // 90s — covers HF Spaces cold start

      const pingUrl = `${baseUrl}/`;
      
      console.log(`[BackendStatusDot] Pinging ${backendKey}:`, pingUrl);

      const res = await fetch(pingUrl, {
        method: 'GET',
        signal: controller.signal,
      });
      clearTimeout(timeout);

      console.log(`[BackendStatusDot] ${backendKey} response:`, res.status);
      setStatus(res.ok || res.status < 500 ? STATUS.ONLINE : STATUS.OFFLINE);
    } catch (error) {
      console.error(`[BackendStatusDot] ${backendKey} error:`, error.message);
      setStatus(STATUS.OFFLINE);
    }
  };

  // Pulse animation while checking
  useEffect(() => {
    if (status === STATUS.CHECKING) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 0.4, duration: 600, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    }
    pulse.setValue(1);
  }, [status]);

  // Initial ping + interval
  useEffect(() => {
    ping();
    const id = setInterval(ping, PING_INTERVAL_MS);
    return () => clearInterval(id);
  }, [backendKey]);

  const dotColor = COLORS[status];

  return (
    <View style={[styles.container, style]}>
      {/* Glow ring for online status */}
      {status === STATUS.ONLINE && (
        <View style={[styles.glow, { backgroundColor: dotColor }]} />
      )}
      <Animated.View
        style={[
          styles.dot,
          { backgroundColor: dotColor, opacity: pulse },
        ]}
      />
      {label && (
        <Text style={[styles.label, { color: dotColor }]}>
          {LABELS[status]}
        </Text>
      )}
    </View>
  );
};

const DOT_SIZE = 10;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
  },
  glow: {
    position: 'absolute',
    width: DOT_SIZE + 6,
    height: DOT_SIZE + 6,
    borderRadius: (DOT_SIZE + 6) / 2,
    opacity: 0.25,
    left: -3,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default BackendStatusDot;
