/**
 * Browser-native speech input and output.
 *
 * Input uses the Web Speech API (SpeechRecognition), which Chrome and Edge
 * support. Output uses SpeechSynthesis, which every modern browser supports.
 * Nothing here touches the network, so voice works offline and costs nothing.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Language } from './api'

const LOCALE: Record<Language, string> = { en: 'en-US', si: 'si-LK' }

/* ------------------------------------------------------------------ */
/* Types that Safari/older browsers may not ship                       */
/* ------------------------------------------------------------------ */

interface SpeechRecognitionAlternativeLike {
  transcript: string
}
interface SpeechRecognitionResultLike {
  isFinal: boolean
  0: SpeechRecognitionAlternativeLike
}
interface SpeechRecognitionEventLike extends Event {
  resultIndex: number
  results: {
    length: number
    [index: number]: SpeechRecognitionResultLike
  }
}
interface SpeechRecognitionLike extends EventTarget {
  lang: string
  continuous: boolean
  interimResults: boolean
  start(): void
  stop(): void
  abort(): void
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: ((event: Event) => void) | null
  onend: (() => void) | null
}
type SpeechRecognitionFactory = () => SpeechRecognitionLike

function getRecognitionFactory(): SpeechRecognitionFactory | null {
  const scope = window as unknown as {
    SpeechRecognition?: SpeechRecognitionFactory
    webkitSpeechRecognition?: SpeechRecognitionFactory
  }
  return scope.SpeechRecognition ?? scope.webkitSpeechRecognition ?? null
}

export function isSpeechInputSupported(): boolean {
  return typeof window !== 'undefined' && getRecognitionFactory() !== null
}

export function isSpeechOutputSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

/* ------------------------------------------------------------------ */
/* Speaking text aloud                                                 */
/* ------------------------------------------------------------------ */

export function useSpeech(language: Language) {
  const supported = isSpeechOutputSupported()
  const [speaking, setSpeaking] = useState(false)

  const cancel = useCallback(() => {
    if (supported) window.speechSynthesis.cancel()
    setSpeaking(false)
  }, [supported])

  const speak = useCallback(
    (text: string) => {
      if (!supported || !text.trim()) return
      const synth = window.speechSynthesis
      synth.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      const wanted = LOCALE[language]
      const voices = synth.getVoices()
      const exact = voices.find((voice) => voice.lang === wanted)
      const prefix = voices.find((voice) => voice.lang.startsWith(wanted.slice(0, 2)))
      if (exact ?? prefix) {
        utterance.voice = (exact ?? prefix) as SpeechSynthesisVoice
      }
      utterance.lang = wanted
      utterance.rate = 1
      utterance.onend = () => setSpeaking(false)
      utterance.onerror = () => setSpeaking(false)

      setSpeaking(true)
      synth.speak(utterance)
    },
    [supported, language],
  )

  // Stop talking if the page goes away or the component unmounts.
  useEffect(() => () => window.speechSynthesis?.cancel(), [])

  return { speak, cancel, speaking, supported }
}

/* ------------------------------------------------------------------ */
/* Dictating a message                                                 */
/* ------------------------------------------------------------------ */

export function useDictation(
  language: Language,
  onResult: (text: string) => void,
) {
  const factory = getRecognitionFactory()
  const supported = factory !== null
  const [listening, setListening] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const finalRef = useRef('')

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
  }, [])

  const start = useCallback(() => {
    if (!factory) return
    setError(null)
    finalRef.current = ''

    const recognition = factory()
    recognition.lang = LOCALE[language]
    recognition.continuous = false
    recognition.interimResults = true

    recognition.onresult = (event) => {
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i]
        if (result.isFinal) finalRef.current += result[0].transcript
        else interim += result[0].transcript
      }
      const spoken = `${finalRef.current}${interim}`.trim()
      if (spoken) onResult(spoken)
    }

    recognition.onerror = (event) => {
      const kind = (event as { error?: string }).error
      if (kind === 'not-allowed' || kind === 'service-not-allowed') {
        setError('Microphone access was blocked. Allow it in your browser settings.')
      } else if (kind === 'no-speech') {
        setError('No speech was detected. Try again.')
      } else if (kind === 'network') {
        setError('Speech recognition needs a working internet connection.')
      } else {
        setError('Could not start dictation. Try again.')
      }
      setListening(false)
    }

    recognition.onend = () => {
      setListening(false)
      recognitionRef.current = null
    }

    recognitionRef.current = recognition
    try {
      recognition.start()
      setListening(true)
    } catch {
      setError('Could not start dictation. Try again.')
      setListening(false)
    }
  }, [factory, language, onResult])

  const toggle = useCallback(() => {
    if (listening) stop()
    else start()
  }, [listening, start, stop])

  useEffect(() => () => recognitionRef.current?.abort(), [])

  return { supported, listening, error, start, stop, toggle, clearError: () => setError(null) }
}