import { useState, useEffect, useRef, useCallback } from 'react';
import { InputAction } from '../types';
import { SWIPE_THRESHOLD } from '../constants';

export const useInput = () => {
    const [lastAction, setLastAction] = useState<InputAction>(InputAction.None);
    const startTouchRef = useRef<{ clientX: number; clientY: number } | null>(null);
    const isDraggingRef = useRef(false);

    const resetSwipe = useCallback(() => {
        startTouchRef.current = null;
        isDraggingRef.current = false;
    }, []);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        let action = InputAction.None;
        switch (e.key) {
            case 'ArrowLeft':
            case 'a':
                action = InputAction.Left;
                break;
            case 'ArrowRight':
            case 'd':
                action = InputAction.Right;
                break;
            case 'ArrowUp':
            case 'w':
            case ' ': // Spacebar for jump
                action = InputAction.Up;
                break;
            case 'ArrowDown':
            case 's':
                action = InputAction.Down;
                break;
            default:
                break;
        }
        if (action !== InputAction.None) {
            setLastAction(action);
            e.preventDefault(); // Prevent default scroll behavior for arrow keys
        }
    }, []);

    const handlePointerDown = useCallback((e: MouseEvent | TouchEvent) => {
        isDraggingRef.current = true;
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        startTouchRef.current = { clientX, clientY };
    }, []);

    const handlePointerUp = useCallback((e: MouseEvent | TouchEvent) => {
        if (!isDraggingRef.current || !startTouchRef.current) {
            resetSwipe();
            return;
        }

        const startX = startTouchRef.current.clientX;
        const startY = startTouchRef.current.clientY;
        const endX = 'changedTouches' in e ? e.changedTouches[0].clientX : e.clientX;
        const endY = 'changedTouches' in e ? e.changedTouches[0].clientY : e.clientY;

        const swipeDeltaX = endX - startX;
        const swipeDeltaY = endY - startY;

        if (Math.abs(swipeDeltaX) > SWIPE_THRESHOLD || Math.abs(swipeDeltaY) > SWIPE_THRESHOLD) {
            if (Math.abs(swipeDeltaX) > Math.abs(swipeDeltaY)) {
                if (swipeDeltaX < 0) setLastAction(InputAction.Left);
                else setLastAction(InputAction.Right);
            } else {
                if (swipeDeltaY < 0) setLastAction(InputAction.Up);
                else setLastAction(InputAction.Down);
            }
        }
        resetSwipe();
    }, [resetSwipe]);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('mousedown', handlePointerDown);
        document.addEventListener('mouseup', handlePointerUp);
        document.addEventListener('touchstart', handlePointerDown);
        document.addEventListener('touchend', handlePointerUp);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('mousedown', handlePointerDown);
            document.removeEventListener('mouseup', handlePointerUp);
            document.removeEventListener('touchstart', handlePointerDown);
            document.removeEventListener('touchend', handlePointerUp);
        };
    }, [handleKeyDown, handlePointerDown, handlePointerUp]);

    return { lastAction, resetAction: () => setLastAction(InputAction.None) };
};
