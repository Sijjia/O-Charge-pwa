import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";

import slide1 from "@/assets/images/onboarding/slide_1.png";
import slide2 from "@/assets/images/onboarding/slide_2.png";
import slide3 from "@/assets/images/onboarding/slide_3.png";
import slide4 from "@/assets/images/onboarding/slide_4.png";

interface OnboardingSlidesProps {
  onComplete: () => void;
  onSkip: () => void;
}

interface Slide {
  id: number;
  title: string;
  description: string;
  secondaryText?: string;
  image: string;
}

const slides: Slide[] = [
  {
    id: 1,
    title: "Добро пожаловать в Red Petroleum",
    description: "Зарядка электромобилей — просто и удобно",
    image: slide1,
  },
  {
    id: 2,
    title: "Вход по номеру телефона",
    description: "Введите номер телефона — код придёт по SMS",
    secondaryText: "После входа пополните баланс через QR-код",
    image: slide2,
  },
  {
    id: 3,
    title: "Найдите станцию и начните зарядку",
    description: "Найдите станцию на карте, в списке или по QR-коду",
    secondaryText: "Подключите кабель, выберите коннектор и нажмите «Старт»",
    image: slide3,
  },
  {
    id: 4,
    title: "Завершение зарядки",
    description: "Автоматически при достижении лимита",
    secondaryText: "или вручную — кнопкой «Стоп»",
    image: slide4,
  },
];

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
  }),
};

export function OnboardingSlides({
  onComplete,
  onSkip,
}: OnboardingSlidesProps) {
  const [[currentSlide, direction], setCurrentSlide] = useState([0, 0]);

  const isLastSlide = currentSlide === slides.length - 1;

  const goToNext = () => {
    if (isLastSlide) {
      onComplete();
    } else {
      setCurrentSlide([currentSlide + 1, 1]);
    }
  };

  const goToPrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide([currentSlide - 1, -1]);
    }
  };

  const slide = slides[currentSlide];

  // Safety check - should never happen but TypeScript needs this
  if (!slide) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-zinc-900 flex flex-col">
      {/* Skip button */}
      <div className="absolute top-4 right-4 safe-area-inset-top z-10">
        <button
          onClick={onSkip}
          className="flex items-center gap-1 px-3 py-2 text-sm text-gray-500 hover:text-gray-300 transition-colors rounded-lg hover:bg-zinc-800"
        >
          Пропустить
          <Icon icon="solar:close-linear" width={16} />
        </button>
      </div>

      {/* Slide content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={slide.id}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
          >
            <div className="flex flex-col items-center text-center max-w-sm">
            {/* Image container */}
            <div className="w-64 h-64 sm:w-80 sm:h-80 rounded-3xl overflow-hidden mb-8 shadow-2xl shadow-red-500/10 flex-shrink-0 relative">
              <img
                src={slide.image}
                alt={slide.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/10" />
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-white mb-4">
              {slide.title}
            </h1>

            {/* Description */}
            <p className="text-gray-400 text-base sm:text-lg leading-relaxed">
              {slide.description}
            </p>

            {/* Secondary text */}
            {slide.secondaryText && (
              <p className="text-gray-500 mt-3 text-sm sm:text-base">
                {slide.secondaryText}
              </p>
            )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom navigation */}
      <div className="px-8 pb-8 safe-area-inset-bottom">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-6">
          {slides.map((slideItem) => (
            <button
              key={slideItem.id}
              onClick={() =>
                setCurrentSlide([
                  slideItem.id - 1,
                  slideItem.id - 1 > currentSlide ? 1 : -1,
                ])
              }
              className={`w-2 h-2 rounded-full transition-all duration-300 ${slideItem.id - 1 === currentSlide
                  ? "w-6 bg-red-500"
                  : "bg-gray-600 hover:bg-gray-500"
                }`}
              aria-label={`Слайд ${slideItem.id}`}
            />
          ))}
        </div>

        {/* Navigation buttons */}
        <div className="flex gap-3">
          {currentSlide > 0 && (
            <button
              onClick={goToPrev}
              className="flex-1 py-4 px-6 rounded-xl border-2 border-zinc-800 text-gray-300 font-semibold hover:bg-zinc-900/50 transition-colors"
            >
              Назад
            </button>
          )}
          <button
            onClick={goToNext}
            className={`flex-1 py-4 px-6 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2 ${currentSlide === 0 ? "w-full" : ""
              }`}
          >
            {isLastSlide ? "Начать" : "Далее"}
            {!isLastSlide && <Icon icon="solar:alt-arrow-right-linear" width={20} />}
          </button>
        </div>
      </div>
    </div>
  );
}

export default OnboardingSlides;
