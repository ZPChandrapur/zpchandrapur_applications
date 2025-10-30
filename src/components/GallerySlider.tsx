import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface GalleryImage {
  url: string;
  title: string;
  category: string;
}

const galleryImages: GalleryImage[] = [
  {
    url: 'https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=800',
    title: 'Employee Onboarding',
    category: 'Human Resources'
  },
  {
    url: 'https://images.pexels.com/photos/3182796/pexels-photo-3182796.jpeg?auto=compress&cs=tinysrgb&w=800',
    title: 'Department Meetings',
    category: 'Team Collaboration'
  },
  {
    url: 'https://images.pexels.com/photos/3184638/pexels-photo-3184638.jpeg?auto=compress&cs=tinysrgb&w=800',
    title: 'Training Programs',
    category: 'Professional Development'
  },
  {
    url: 'https://images.pexels.com/photos/3183197/pexels-photo-3183197.jpeg?auto=compress&cs=tinysrgb&w=800',
    title: 'Performance Reviews',
    category: 'Employee Assessment'
  },
  {
    url: 'https://images.pexels.com/photos/3184339/pexels-photo-3184339.jpeg?auto=compress&cs=tinysrgb&w=800',
    title: 'Project Planning',
    category: 'Task Management'
  },
  {
    url: 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=800',
    title: 'Team Building',
    category: 'Workplace Culture'
  }
];

export default function GallerySlider() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const itemsPerView = 3;
  const maxIndex = Math.max(0, galleryImages.length - itemsPerView);

  const goToPrevious = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => Math.min(maxIndex, prev + 1));
  };

  return (
    <section className="bg-gradient-to-br from-brown-900 via-green-900 to-brown-800 py-20 border-t-4 border-yellow-500">
      <div className="max-w-7xl mx-auto px-8">
        <div className="text-center mb-12">
          <h2 className="text-5xl font-bold text-yellow-300 mb-4 drop-shadow-lg">Employee Activities</h2>
          <p className="text-xl text-green-200 font-semibold">
            Explore workplace culture and professional development opportunities
          </p>
        </div>

        <div className="relative">
          <div className="overflow-hidden">
            <div
              className="flex gap-6 transition-transform duration-500 ease-out"
              style={{
                transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)`
              }}
            >
              {galleryImages.map((image, index) => (
                <div
                  key={index}
                  className="flex-shrink-0 w-full md:w-1/3 group cursor-pointer"
                >
                  <div className="relative overflow-hidden rounded-2xl shadow-2xl aspect-[4/3] border-4 border-yellow-400">
                    <img
                      src={image.url}
                      alt={image.title}
                      className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-brown-900/95 via-green-900/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="absolute bottom-0 left-0 right-0 p-6 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                      <div className="text-sm font-bold text-yellow-400 mb-2">
                        {image.category}
                      </div>
                      <h3 className="text-xl font-bold text-green-200">
                        {image.title}
                      </h3>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {currentIndex > 0 && (
            <button
              onClick={goToPrevious}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-gradient-to-br from-yellow-400 to-amber-500 text-brown-900 p-4 rounded-full shadow-2xl hover:from-yellow-300 hover:to-amber-400 transition-all hover:scale-110 z-10 border-2 border-yellow-300"
              aria-label="Previous images"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {currentIndex < maxIndex && (
            <button
              onClick={goToNext}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-gradient-to-br from-yellow-400 to-amber-500 text-brown-900 p-4 rounded-full shadow-2xl hover:from-yellow-300 hover:to-amber-400 transition-all hover:scale-110 z-10 border-2 border-yellow-300"
              aria-label="Next images"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </div>

        <div className="flex justify-center mt-8 space-x-2">
          {Array.from({ length: maxIndex + 1 }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-3 rounded-full transition-all duration-300 border-2 ${
                index === currentIndex
                  ? 'bg-yellow-400 border-yellow-300 w-10 shadow-lg'
                  : 'bg-green-600 border-green-500 w-3 hover:bg-green-500'
              }`}
              aria-label={`Go to slide group ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
