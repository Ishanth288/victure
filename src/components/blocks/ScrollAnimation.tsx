
export function ScrollAnimation() {
  return (
    <section id="scroll-animation" className="py-20 bg-gradient-to-r from-primary/5 to-secondary/5">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-6">
            About Victure
          </h2>
          <p className="text-lg text-neutral-600 mb-8">
            We're dedicated to revolutionizing pharmacy management through innovative technology and AI-powered insights.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-white rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-4">Our Mission</h3>
              <p className="text-neutral-600">
                Empowering pharmacies with cutting-edge technology to improve patient care and business efficiency.
              </p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-4">Our Vision</h3>
              <p className="text-neutral-600">
                To be the leading platform that transforms how pharmacies operate and serve their communities.
              </p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-4">Our Values</h3>
              <p className="text-neutral-600">
                Innovation, reliability, and customer success drive everything we do.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
