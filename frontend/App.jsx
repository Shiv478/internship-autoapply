import { useState, useEffect } from 'react';

function App() {
  // State management
  const [internships, setInternships] = useState([]);
  const [profile, setProfile] = useState(null);
  const [selectedInternship, setSelectedInternship] = useState(null);
  const [answers, setAnswers] = useState({});
  const [essay, setEssay] = useState('');
  const [previewImage, setPreviewImage] = useState('');

  // Fetch internships on load
  useEffect(() => {
    const fetchInternships = async () => {
      try {
        const response = await fetch('http://localhost:3000/internships');
        const data = await response.json();
        setInternships(data);
      } catch (error) {
        console.error('Failed to fetch internships:', error);
      }
    };
    fetchInternships();
  }, []);

  // Handle resume upload
  const handleUpload = async (event) => {
    const file = event.target.files[0];
    const formData = new FormData();
    formData.append('resume', file);

    try {
      const response = await fetch('http://localhost:3000/upload', {
        method: 'POST',
        body: formData
      });
      const profileData = await response.json();
      setProfile(profileData);
    } catch (error) {
      console.error('Failed to upload resume:', error);
    }
  };

  // Handle autofill
  const handleAutofill = async () => {
    if (!profile || !selectedInternship) return;

    try {
      const response = await fetch('http://localhost:3000/autofill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile,
          questions: selectedInternship.questions
        })
      });
      const data = await response.json();
      setAnswers(data);
    } catch (error) {
      console.error('Failed to autofill answers:', error);
    }
  };

  // Handle essay generation
  const handleGenerateEssay = async () => {
    if (!profile) return;

    try {
      const response = await fetch('http://localhost:3000/essay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bullets: profile.highlights,
          length: 300,
          tone: 'professional'
        })
      });
      const data = await response.json();
      setEssay(data.essay);
    } catch (error) {
      console.error('Failed to generate essay:', error);
    }
  };

  // Handle application preview
  const handlePreview = async () => {
    if (!profile || !selectedInternship || !answers) return;

    try {
      const response = await fetch('http://localhost:3000/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postingUrl: selectedInternship.url,
          profile,
          answers,
          options: { preview: true }
        })
      });
      const data = await response.json();
      setPreviewImage(data.previewPath);
    } catch (error) {
      console.error('Failed to preview application:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Resume Upload Section */}
      <section className="mb-8">
        <h2 className="text-xl font-bold mb-4">Upload Resume</h2>
        <input
          type="file"
          accept=".pdf,.docx"
          onChange={handleUpload}
          className="border p-2 rounded"
        />
        {profile && (
          <div className="mt-4 p-4 bg-gray-100 rounded">
            <pre>{JSON.stringify(profile, null, 2)}</pre>
          </div>
        )}
      </section>

      {/* Internships List Section */}
      <section className="mb-8">
        <h2 className="text-xl font-bold mb-4">Available Internships</h2>
        <div className="grid gap-4">
          {internships.map(internship => (
            <div
              key={internship.id}
              className={`p-4 border rounded cursor-pointer ${
                selectedInternship?.id === internship.id ? 'border-blue-500' : ''
              }`}
              onClick={() => setSelectedInternship(internship)}
            >
              <h3 className="font-bold">{internship.title}</h3>
              <p>{internship.company}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Application Section */}
      {selectedInternship && profile && (
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4">Application</h2>
          
          <button
            onClick={handleAutofill}
            className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
          >
            Autofill Answers
          </button>
          
          {Object.entries(answers).length > 0 && (
            <div className="mt-4">
              {Object.entries(answers).map(([question, answer]) => (
                <div key={question} className="mb-4">
                  <label className="block mb-2">{question}</label>
                  <textarea
                    value={answer}
                    onChange={(e) => setAnswers(prev => ({
                      ...prev,
                      [question]: e.target.value
                    }))}
                    className="w-full p-2 border rounded"
                    rows="4"
                  />
                </div>
              ))}
            </div>
          )}

          <button
            onClick={handleGenerateEssay}
            className="bg-green-500 text-white px-4 py-2 rounded mr-2"
          >
            Generate Essay
          </button>

          {essay && (
            <div className="mt-4">
              <textarea
                value={essay}
                onChange={(e) => setEssay(e.target.value)}
                className="w-full p-2 border rounded"
                rows="6"
              />
            </div>
          )}

          <button
            onClick={handlePreview}
            className="bg-purple-500 text-white px-4 py-2 rounded"
          >
            Preview Application
          </button>

          {previewImage && (
            <div className="mt-4">
              <img src={previewImage} alt="Application Preview" className="max-w-full" />
            </div>
          )}
        </section>
      )}
    </div>
  );
}

export default App;
