import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Slide {
  image: string;
  title: string;
  description: string;
}

const slides: Slide[] = [
  {
    image: 'Bison_In_Tiger.jpg',
    title: '',
    description: 'Tadoba-Andhari Tiger Reserve'
  },
  {
  image: 'Bhadravi_Jain_Temple.jpg',
  title: '',
  description: 'Bhadravi Jain Temple'
  },
    {
    image: 'Deer_In_Tadoba_National.jpg',
    title: '',
    description: 'Tadoba-Andhari Tiger Reserve'
  },
  {
    image: 'Anchaleshwar_Temple.jpg',
    title: '',
    description: 'Anchaleshwar Temple'
  },
  {
    image: 'Ghoda_Jhari_Lake.jpg',
    title: '',
    description: 'Ghoda Jhari Lake'
  },
  {
    image: 'Junona_Jungle_Jal_Mahal.jpg',
    title: '',
    description: 'Junona Jungle Jal Mahal'
  },
    {
    image: 'Maha_Kali_Temple.jpg',
    title: '',
    description: 'Maha Kali Temple'
  },
    {
    image: 'Vijasan_Hills.jpg',
    title: '',
    description: 'Vijasan Hills'
  }
];

export default function ImageSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  return (
    <div className="relative w-full h-[600px] overflow-hidden group">
      <div className="relative w-full h-full">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
              index === currentIndex
                ? 'opacity-100 scale-100'
                : 'opacity-0 scale-105'
            }`}
          >
<div className="absolute inset-0 bg-gradient-to-r from-[#edb742]/30 via-amber-900/40 to-green-900/30 z-10"></div>
            <img
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 z-20 flex items-center justify-center">
              <div className="max-w-4xl mx-auto px-8 text-center">
                <h2
                  className={`text-5xl md:text-6xl font-bold text-yellow-300 mb-6 transition-all duration-1000 delay-300 drop-shadow-2xl ${
                    index === currentIndex
                      ? 'translate-y-0 opacity-100'
                      : 'translate-y-10 opacity-0'
                  }`}
                >
                  {slide.title}
                </h2>
                <p
                  // className={`text-xl md:text-2xl text-green-200 font-semibold transition-all duration-1000 delay-500 drop-shadow-lg ${
                  //   index === currentIndex
                  //     ? 'translate-y-0 opacity-100'
                  //     : 'translate-y-10 opacity-0'
                  // }`}
                  className={`absolute left-0 right-0 bottom-16 text-xl md:text-2xl text-yellow-300 font-semibold transition-all duration-1000 delay-500 drop-shadow-lg ${
                    index === currentIndex
                      ? 'translate-y-0 opacity-100'
                      : 'translate-y-10 opacity-0'
                  }`}
                >
                  {slide.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={goToPrevious}
        className="absolute left-6 top-1/2 -translate-y-1/2 z-30 bg-gradient-to-br from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-brown-900 p-4 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-110 shadow-2xl border-2 border-yellow-300"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <button
        onClick={goToNext}
        className="absolute right-6 top-1/2 -translate-y-1/2 z-30 bg-gradient-to-br from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-brown-900 p-4 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-110 shadow-2xl border-2 border-yellow-300"
        aria-label="Next slide"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex space-x-3">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`transition-all duration-300 rounded-full border-2 ${
              index === currentIndex
                ? 'bg-yellow-400 border-yellow-300 w-12 h-4 shadow-lg'
                : 'bg-white/50 border-white/70 hover:bg-yellow-300 hover:border-yellow-200 w-4 h-4'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-amber-50 to-transparent z-20"></div>
    </div>
  );
}
