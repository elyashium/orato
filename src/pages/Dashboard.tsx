import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, CheckCircle, AlertCircle, ArrowRight, Briefcase, Menu, User, Edit, LogOut, Linkedin, Globe, X, Upload } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

const Dashboard = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [resumeLink, setResumeLink] = useState('');
  const [resumeLinkSuccess, setResumeLinkSuccess] = useState(false);
  const [resumeLinkError, setResumeLinkError] = useState('');
  const [updatingResumeLink, setUpdatingResumeLink] = useState(false);
  
  // Form state for profile editing
  const [editForm, setEditForm] = useState({
    displayName: '',
    location: '',
    experience: '',
    education: '',
    expectedSalary: '',
    linkedin: '',
    portfolio: '',
    skills: ''
  });
  const [updating, setUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  // Inside the Dashboard component, add these new state variables
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Add this new state for the alert
  const [showResumeAlert, setShowResumeAlert] = useState(false);

  // Fetch user details from Firestore
  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!currentUser) return;
      
      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserDetails(userData);
          setResumeLink(userData.resumeURL || '');
          
          // Initialize edit form with current values
          setEditForm({
            displayName: userData.displayName || '',
            location: userData.location || '',
            experience: userData.experience || '',
            education: userData.education || '',
            expectedSalary: userData.expectedSalary || '',
            linkedin: userData.linkedin || '',
            portfolio: userData.portfolio || '',
            skills: userData.skills ? userData.skills.join(', ') : ''
          });
        } else {
          console.log('No user details found');
        }
      } catch (error) {
        console.error('Error fetching user details:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserDetails();
  }, [currentUser]);

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  // Toggle menu
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    setIsEditingProfile(false);
  };
  
  // Toggle edit profile mode
  const toggleEditProfile = () => {
    setIsEditingProfile(!isEditingProfile);
  };

  // Handle resume link update
  const handleResumeUpdate = async () => {
    if (!currentUser || !resumeLink) return;

    setUpdatingResumeLink(true);
    setResumeLinkError('');

    try {
      // Validate URL format
      try {
        new URL(resumeLink);
      } catch (e) {
        throw new Error('Please enter a valid URL (include http:// or https://)');
      }
      
      // Update user document with resume URL
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        resumeURL: resumeLink
      });
      
      // Update local state
      setUserDetails(prev => {
        if (!prev) return { resumeURL: resumeLink };
        return { ...prev, resumeURL: resumeLink };
      });
      
      setResumeLinkSuccess(true);
      
      // Reset success message after 3 seconds
      setTimeout(() => {
        setResumeLinkSuccess(false);
      }, 3000);
    } catch (err: any) {
      console.error('Resume link update error:', err);
      setResumeLinkError(err.message || 'Failed to update resume link. Please try again.');
    } finally {
      setUpdatingResumeLink(false);
    }
  };
  
  // Handle profile update
  const handleProfileUpdate = async () => {
    if (!currentUser) return;
    
    setUpdating(true);
    setError('');
    
    try {
      const skillsArray = editForm.skills
        ? editForm.skills.split(',').map(skill => skill.trim())
        : [];
      
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        displayName: editForm.displayName,
        location: editForm.location,
        experience: editForm.experience,
        education: editForm.education,
        expectedSalary: editForm.expectedSalary,
        linkedin: editForm.linkedin,
        portfolio: editForm.portfolio,
        skills: skillsArray
      });
      
      // Update local state
      setUserDetails(prev => {
        if (!prev) return { ...editForm, skills: skillsArray };
        return { 
          ...prev, 
          displayName: editForm.displayName,
          location: editForm.location,
          experience: editForm.experience,
          education: editForm.education,
          expectedSalary: editForm.expectedSalary,
          linkedin: editForm.linkedin,
          portfolio: editForm.portfolio,
          skills: skillsArray
        };
      });
      
      setUpdateSuccess(true);
      
      // Reset success message after 3 seconds
      setTimeout(() => {
        setUpdateSuccess(false);
        setIsEditingProfile(false);
      }, 2000);
    } catch (err) {
      console.error('Profile update error:', err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  // Handle form input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Start interview
  const startInterview = () => {
    // During development, we'll allow starting interviews without a resume
    navigate('/interview');
    
    // The resume check code is commented out for development
    /*
    if (!userDetails?.resumeURL) {
      setShowResumeAlert(true);
      
      setTimeout(() => {
        setShowResumeAlert(false);
      }, 5000);
      return;
    }
    
    navigate('/interview');
    */
  };

  // Add this new function to handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    
    if (selectedFile) {
      // Check if file is a PDF
      if (selectedFile.type !== 'application/pdf') {
        setUploadError('Please upload a PDF file');
        setFile(null);
        return;
      }
      
      // Check file size (limit to 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setUploadError('File size should be less than 5MB');
        setFile(null);
        return;
      }
      
      setFile(selectedFile);
      setUploadError('');
    }
  };

  // Add this function to handle resume upload
  const handleResumeFileUpload = async () => {
    if (!file || !currentUser) return;
    
    setUploading(true);
    setUploadError('');
    
    try {
      // Create a FormData object to send the file
      const formData = new FormData();
      formData.append('resume', file);
      formData.append('userId', currentUser.uid);
      
      // Send the file to your server endpoint
      const response = await fetch('https://your-backend-api.com/upload-resume', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload resume');
      }
      
      const data = await response.json();
      
      // Update Firestore with the resume URL from your server
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        resumeURL: data.fileUrl,
        resumeName: file.name
      });
      
      // Update local state
      setUserDetails(prev => {
        if (!prev) return { resumeURL: data.fileUrl, resumeName: file.name };
        return { ...prev, resumeURL: data.fileUrl, resumeName: file.name };
      });
      
      setUploadSuccess(true);
      setFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('resume-file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      // Reset success message after 3 seconds
      setTimeout(() => {
        setUploadSuccess(false);
      }, 3000);
    } catch (err: any) {
      console.error('Resume upload error:', err);
      setUploadError(err.message || 'Failed to upload resume. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Sticky Navbar */}
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-xl font-bold">NERV</h1>
          </div>
          
          <button
            onClick={toggleMenu}
            className="p-1 rounded-full hover:bg-white/10 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </header>

      {/* User Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              onClick={toggleMenu}
            />
            
            {/* Menu Panel */}
            <motion.div
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-80 bg-black border-l border-white/10 z-50 overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-xl font-bold">
                    {isEditingProfile ? 'Edit Profile' : 'Profile'}
                  </h2>
                  <button
                    onClick={toggleMenu}
                    className="p-2 rounded-full hover:bg-white/10 transition-colors"
                    aria-label="Close menu"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin h-8 w-8 border-2 border-white border-t-transparent rounded-full"></div>
                  </div>
                ) : (
                  <>
                    {isEditingProfile ? (
                      // Edit Profile Form
                      <div className="space-y-4">
                        {error && (
                          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-sm flex items-start">
                            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                            <span>{error}</span>
                          </div>
                        )}
                        
                        <div>
                          <label className="block text-sm font-medium mb-1">Full Name</label>
                          <input
                            type="text"
                            name="displayName"
                            value={editForm.displayName}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 bg-black/50 border border-white/20 rounded-lg focus:ring-1 focus:ring-white focus:border-white/50 focus:outline-none transition-colors"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-1">Location</label>
                          <input
                            type="text"
                            name="location"
                            value={editForm.location}
                            onChange={handleInputChange}
                            placeholder="City, Country"
                            className="w-full px-3 py-2 bg-black/50 border border-white/20 rounded-lg focus:ring-1 focus:ring-white focus:border-white/50 focus:outline-none transition-colors"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-1">Experience</label>
                          <input
                            type="text"
                            name="experience"
                            value={editForm.experience}
                            onChange={handleInputChange}
                            placeholder="e.g. 5 years"
                            className="w-full px-3 py-2 bg-black/50 border border-white/20 rounded-lg focus:ring-1 focus:ring-white focus:border-white/50 focus:outline-none transition-colors"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-1">Education</label>
                          <input
                            type="text"
                            name="education"
                            value={editForm.education}
                            onChange={handleInputChange}
                            placeholder="Degree, Institution"
                            className="w-full px-3 py-2 bg-black/50 border border-white/20 rounded-lg focus:ring-1 focus:ring-white focus:border-white/50 focus:outline-none transition-colors"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-1">Expected Salary</label>
                          <input
                            type="text"
                            name="expectedSalary"
                            value={editForm.expectedSalary}
                            onChange={handleInputChange}
                            placeholder="e.g. $80,000 - $100,000"
                            className="w-full px-3 py-2 bg-black/50 border border-white/20 rounded-lg focus:ring-1 focus:ring-white focus:border-white/50 focus:outline-none transition-colors"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-1">LinkedIn Profile</label>
                          <input
                            type="text"
                            name="linkedin"
                            value={editForm.linkedin}
                            onChange={handleInputChange}
                            placeholder="https://linkedin.com/in/username"
                            className="w-full px-3 py-2 bg-black/50 border border-white/20 rounded-lg focus:ring-1 focus:ring-white focus:border-white/50 focus:outline-none transition-colors"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-1">Portfolio Website</label>
                          <input
                            type="text"
                            name="portfolio"
                            value={editForm.portfolio}
                            onChange={handleInputChange}
                            placeholder="https://yourportfolio.com"
                            className="w-full px-3 py-2 bg-black/50 border border-white/20 rounded-lg focus:ring-1 focus:ring-white focus:border-white/50 focus:outline-none transition-colors"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-1">Skills (comma separated)</label>
                          <textarea
                            name="skills"
                            value={editForm.skills}
                            onChange={handleInputChange}
                            placeholder="React, JavaScript, Node.js, etc."
                            className="w-full px-3 py-2 bg-black/50 border border-white/20 rounded-lg focus:ring-1 focus:ring-white focus:border-white/50 focus:outline-none transition-colors resize-none h-24"
                          />
                        </div>
                        
                        <div className="flex space-x-3 pt-2">
                          <button
                            type="button"
                            onClick={() => setIsEditingProfile(false)}
                            className="flex-1 py-2 border border-white/20 rounded-lg hover:bg-white/10 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleProfileUpdate}
                            disabled={updating}
                            className="flex-1 py-2 bg-white text-black rounded-lg hover:bg-black hover:text-white hover:border hover:border-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {updating ? 'Saving...' : 'Save Changes'}
                          </button>
                        </div>
                        
                        {updateSuccess && (
                          <div className="flex items-center justify-center text-green-500 text-sm">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Profile updated successfully
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        {/* User profile header */}
                        <div className="flex items-center mb-6">
                          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-xl font-bold mr-4">
                            {userDetails?.displayName?.charAt(0) || currentUser?.email?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <h3 className="font-medium text-lg">{userDetails?.displayName || 'User'}</h3>
                            <p className="text-gray-400 text-sm">{currentUser?.email}</p>
                          </div>
                        </div>

                        {/* User Details */}
                        <div className="bg-white/5 rounded-lg p-4 mb-4">
                          <h4 className="text-white text-sm font-medium mb-2">Account Details</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-400 text-sm">Name</span>
                              <span className="text-white text-sm">
                                {userDetails?.displayName || 'Not set'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400 text-sm">Location</span>
                              <span className="text-white text-sm">
                                {userDetails?.location || 'Not set'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400 text-sm">Experience</span>
                              <span className="text-white text-sm">
                                {userDetails?.experience || 'Not set'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400 text-sm">Education</span>
                              <span className="text-white text-sm">
                                {userDetails?.education || 'Not set'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400 text-sm">Expected Salary</span>
                              <span className="text-white text-sm">
                                {userDetails?.expectedSalary || 'Not set'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400 text-sm">Interviews Completed</span>
                              <span className="text-white text-sm">
                                {userDetails?.interviewsCompleted || '0'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Skills Section */}
                        <div className="bg-white/5 rounded-lg p-4 mb-4">
                          <h4 className="text-white text-sm font-medium mb-2">Skills & Expertise</h4>
                          <div className="mb-3">
                            <span className="text-gray-400 text-sm">Technical Expertise:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {userDetails?.expertise?.map((exp: string) => (
                                <span key={exp} className="text-xs bg-white/10 text-white px-2 py-1 rounded-full">
                                  {exp}
                                </span>
                              ))}
                              {(!userDetails?.expertise || userDetails.expertise.length === 0) && (
                                <span className="text-xs text-gray-400">No expertise added</span>
                              )}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-400 text-sm">Skills:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {userDetails?.skills?.map((skill: string) => (
                                <span key={skill} className="text-xs bg-white/10 text-white px-2 py-1 rounded-full">
                                  {skill}
                                </span>
                              ))}
                              {(!userDetails?.skills || userDetails.skills.length === 0) && (
                                <span className="text-xs text-gray-400">No skills added</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Resume Upload Box */}
                        <div className="bg-black border border-white/10 rounded-xl p-6 shadow-lg hover:border-white/30 transition-all mb-6">
                          <h2 className="text-xl font-semibold mb-4 flex items-center">
                            <FileText className="h-5 w-5 mr-2" />
                            Your Resume
                          </h2>
                          
                          {userDetails?.resumeURL ? (
                            <div className="mb-4">
                              <p className="text-gray-400 mb-2">Your resume is ready for interviews</p>
                              <a 
                                href={userDetails.resumeURL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-blue-400 hover:text-blue-300"
                              >
                                <FileText className="h-4 w-4 mr-2" />
                                View Resume {userDetails.resumeName && `(${userDetails.resumeName})`}
                              </a>
                            </div>
                          ) : (
                            <p className="text-gray-400 mb-4">Add your resume to enhance your interview experience</p>
                          )}
                          
                          <div className="space-y-4">
                            {/* File Upload Section */}
                            <div className="border border-dashed border-white/20 rounded-lg p-4 hover:border-white/40 transition-all">
                              <label htmlFor="resume-file-input" className="flex flex-col items-center justify-center cursor-pointer">
                                <Upload className="h-6 w-6 mb-2 text-gray-400" />
                                <span className="text-sm font-medium mb-1">Upload PDF Resume</span>
                                <span className="text-xs text-gray-500">Max 5MB</span>
                                <input 
                                  id="resume-file-input"
                                  type="file" 
                                  accept=".pdf" 
                                  onChange={handleFileChange}
                                  className="hidden" 
                                />
                              </label>
                              
                              {file && (
                                <div className="mt-3 flex items-center justify-between bg-white/5 p-2 rounded">
                                  <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                                  <button 
                                    onClick={() => setFile(null)}
                                    className="text-gray-400 hover:text-white"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              )}
                              
                              {file && (
                                <button
                                  onClick={handleResumeFileUpload}
                                  disabled={uploading}
                                  className="w-full mt-3 py-2 bg-white text-black rounded-lg hover:bg-black hover:text-white hover:border hover:border-white transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
                                >
                                  {uploading ? 'Uploading...' : 'Upload Resume'}
                                </button>
                              )}
                              
                              {uploadError && (
                                <div className="mt-2 flex items-center text-red-500 text-xs">
                                  <AlertCircle className="h-3 w-3 mr-1 flex-shrink-0" />
                                  {uploadError}
                                </div>
                              )}
                              
                              {uploadSuccess && (
                                <div className="mt-2 flex items-center text-green-500 text-xs">
                                  <CheckCircle className="h-3 w-3 mr-1 flex-shrink-0" />
                                  Resume uploaded successfully
                                </div>
                              )}
                            </div>
                            
                            {/* OR Divider */}
                            <div className="flex items-center">
                              <div className="flex-grow border-t border-white/10"></div>
                              <span className="mx-4 text-xs text-gray-500">OR</span>
                              <div className="flex-grow border-t border-white/10"></div>
                            </div>
                            
                            {/* URL Input Section */}
                            <div>
                              <p className="text-sm text-gray-400 mb-2">Add a link to your resume</p>
                              <input
                                type="text"
                                value={resumeLink}
                                onChange={(e) => setResumeLink(e.target.value)}
                                placeholder="Enter resume URL (Google Drive, Dropbox, etc.)"
                                className="w-full px-3 py-2 bg-black/50 border border-white/20 rounded-lg focus:ring-1 focus:ring-white focus:border-white/50 focus:outline-none transition-colors"
                              />
                              
                              <button
                                onClick={handleResumeUpdate}
                                disabled={!resumeLink || updatingResumeLink}
                                className="w-full mt-3 py-2 bg-white text-black rounded-lg hover:bg-black hover:text-white hover:border hover:border-white transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                              >
                                {updatingResumeLink ? 'Updating...' : userDetails?.resumeURL ? 'Update Resume Link' : 'Add Resume Link'}
                              </button>
                              
                              {resumeLinkSuccess && (
                                <div className="mt-2 flex items-center text-green-500 text-xs">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Resume link updated successfully
                                </div>
                              )}
                              
                              {resumeLinkError && (
                                <div className="mt-2 flex items-center text-red-500 text-xs">
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  {resumeLinkError}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Links Section */}
                        <div className="bg-white/5 rounded-lg p-4 mb-4">
                          <h4 className="text-white text-sm font-medium mb-2">Professional Links</h4>
                          {userDetails?.linkedin && (
                            <a 
                              href={userDetails.linkedin}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center text-sm text-blue-400 hover:text-blue-300 mb-2"
                            >
                              <Linkedin className="h-4 w-4 mr-2" />
                              LinkedIn Profile
                            </a>
                          )}
                          {userDetails?.portfolio && (
                            <a 
                              href={userDetails.portfolio}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center text-sm text-blue-400 hover:text-blue-300 mb-2"
                            >
                              <Globe className="h-4 w-4 mr-2" />
                              Portfolio Website
                            </a>
                          )}
                          {(!userDetails?.linkedin && !userDetails?.portfolio) && (
                            <p className="text-sm text-gray-400">No professional links added</p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="space-y-2">
                          <button
                            onClick={toggleEditProfile}
                            className="w-full py-2 px-4 flex items-center rounded-lg hover:bg-white/10 transition-colors"
                          >
                            <Edit className="h-5 w-5 mr-3" />
                            <span>Edit Profile</span>
                          </button>
                          <button
                            onClick={handleLogout}
                            className="w-full py-2 px-4 flex items-center rounded-lg hover:bg-white/10 transition-colors"
                          >
                            <LogOut className="h-5 w-5 mr-3" />
                            <span>Logout</span>
                          </button>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content - Adjusted to fit on one screen */}
      <div className="flex-1 flex items-center justify-center">
        <div className="max-w-7xl w-full mx-auto px-4 py-6">
          {/* Dashboard content */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Welcome Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-3xl font-bold mb-1">Welcome to your NERV interview</h1>
              <p className="text-gray-400 text-sm mb-4">Let's get you ready for your next technical interview</p>
              
              {/* Resume Upload Box - More compact */}
              <div className="bg-black border border-white/10 rounded-xl p-4 shadow-lg hover:border-white/30 transition-all">
                <h2 className="text-lg font-semibold mb-3 flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  Your Resume
                </h2>
                
                {userDetails?.resumeURL ? (
                  <div className="mb-3">
                    <p className="text-gray-400 text-sm mb-1">Your resume is ready for interviews</p>
                    <a 
                      href={userDetails.resumeURL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-blue-400 hover:text-blue-300 text-sm"
                    >
                      <FileText className="h-3 w-3 mr-1" />
                      View Resume {userDetails.resumeName && `(${userDetails.resumeName})`}
                    </a>
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm mb-3">Add your resume to enhance your interview experience</p>
                )}
                
                <div className="space-y-3">
                  {/* File Upload Section */}
                  <div className="border border-dashed border-white/20 rounded-lg p-3 hover:border-white/40 transition-all">
                    <label htmlFor="resume-file-input" className="flex flex-col items-center justify-center cursor-pointer">
                      <Upload className="h-5 w-5 mb-1 text-gray-400" />
                      <span className="text-xs font-medium">Upload PDF Resume</span>
                      <span className="text-xs text-gray-500">Max 5MB</span>
                      <input 
                        id="resume-file-input"
                        type="file" 
                        accept=".pdf" 
                        onChange={handleFileChange}
                        className="hidden" 
                      />
                    </label>
                    
                    {file && (
                      <div className="mt-2 flex items-center justify-between bg-white/5 p-1 rounded">
                        <span className="text-xs truncate max-w-[200px]">{file.name}</span>
                        <button 
                          onClick={() => setFile(null)}
                          className="text-gray-400 hover:text-white"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                    
                    {file && (
                      <button
                        onClick={handleResumeFileUpload}
                        disabled={uploading}
                        className="w-full mt-2 py-1 bg-white text-black rounded-lg hover:bg-black hover:text-white hover:border hover:border-white transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium text-xs"
                      >
                        {uploading ? 'Uploading...' : 'Upload Resume'}
                      </button>
                    )}
                    
                    {uploadError && (
                      <div className="mt-1 flex items-center text-red-500 text-xs">
                        <AlertCircle className="h-3 w-3 mr-1 flex-shrink-0" />
                        {uploadError}
                      </div>
                    )}
                    
                    {uploadSuccess && (
                      <div className="mt-1 flex items-center text-green-500 text-xs">
                        <CheckCircle className="h-3 w-3 mr-1 flex-shrink-0" />
                        Resume uploaded successfully
                      </div>
                    )}
                  </div>
                  
                  {/* OR Divider */}
                  <div className="flex items-center">
                    <div className="flex-grow border-t border-white/10"></div>
                    <span className="mx-2 text-xs text-gray-500">OR</span>
                    <div className="flex-grow border-t border-white/10"></div>
                  </div>
                  
                  {/* URL Input Section */}
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Add a link to your resume</p>
                    <input
                      type="text"
                      value={resumeLink}
                      onChange={(e) => setResumeLink(e.target.value)}
                      placeholder="Enter resume URL (Google Drive, Dropbox, etc.)"
                      className="w-full px-2 py-1 text-sm bg-black/50 border border-white/20 rounded-lg focus:ring-1 focus:ring-white focus:border-white/50 focus:outline-none transition-colors"
                    />
                    
                    <button
                      onClick={handleResumeUpdate}
                      disabled={!resumeLink || updatingResumeLink}
                      className="w-full mt-2 py-1 bg-white text-black rounded-lg hover:bg-black hover:text-white hover:border hover:border-white transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium text-xs"
                    >
                      {updatingResumeLink ? 'Updating...' : userDetails?.resumeURL ? 'Update Resume Link' : 'Add Resume Link'}
                    </button>
                    
                    {resumeLinkSuccess && (
                      <div className="mt-1 flex items-center text-green-500 text-xs">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Resume link updated successfully
                      </div>
                    )}
                    
                    {resumeLinkError && (
                      <div className="mt-1 flex items-center text-red-500 text-xs">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {resumeLinkError}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Interview Prep Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-black border border-white/10 rounded-xl p-4 shadow-lg hover:border-white/30 transition-all h-fit"
            >
              <div className="flex items-center mb-2">
                <Briefcase className="h-4 w-4 text-white mr-2" />
                <h2 className="text-lg font-semibold">Start Interview</h2>
              </div>
              <p className="text-gray-400 text-xs mb-3">
                Ready to practice? Start a simulated technical interview with our AI interviewer.
              </p>

              <div className="space-y-2 mb-3">
                <div className="flex items-center">
                  <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center mr-2 flex-shrink-0">
                    <span className="text-white text-xs font-medium">1</span>
                  </div>
                  <span className="text-gray-300 text-xs">Answer technical questions in real-time</span>
                </div>
                <div className="flex items-center">
                  <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center mr-2 flex-shrink-0">
                    <span className="text-white text-xs font-medium">2</span>
                  </div>
                  <span className="text-gray-300 text-xs">Receive instant feedback on your responses</span>
                </div>
                <div className="flex items-center">
                  <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center mr-2 flex-shrink-0">
                    <span className="text-white text-xs font-medium">3</span>
                  </div>
                  <span className="text-gray-300 text-xs">Review detailed performance analysis</span>
                </div>
              </div>

              {/* Removed for development
                {showResumeAlert && (
                  <div className="mb-2 p-1 bg-amber-500/10 border border-amber-500/50 rounded-lg flex items-center gap-1 text-amber-500">
                    <AlertCircle className="h-3 w-3 flex-shrink-0" />
                    <div className="text-xs">
                      Please upload your resume first to get a personalized interview experience.
                    </div>
                  </div>
                )}
              */}

              <button
                onClick={startInterview}
                className="w-full py-1.5 bg-white text-black rounded-lg hover:bg-black hover:text-white hover:border hover:border-white transition-all flex items-center justify-center text-xs"
              >
                Start Interview
                <ArrowRight className="ml-1 h-3 w-3" />
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 