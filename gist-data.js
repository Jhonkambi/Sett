   // gist-data.js

   const GIST_ID = 'your_gist_id'; // Replace with your Gist ID
   const GIST_FILE = 'queries.json'; // Replace with your Gist filename
   const GITHUB_TOKEN = 'your_github_token'; // Replace with your GitHub token (VERY IMPORTANT: Handle securely!)

   async function loadQuestionsFromGist() {
       try {
           const response = await fetch(`https://api.github.com/gists/${GIST_ID}`);
           if (!response.ok) {
               throw new Error(`HTTP error! status: ${response.status}`);
           }
           const data = await response.json();
           const content = data.files[GIST_FILE].content;
           const gistData = JSON.parse(content);

           // Assuming your main script has a 'setQuestions' function
           // to update the questions array and re-render the UI
           setQuestions(gistData);

       } catch (error) {
           console.error('Error loading questions from Gist:', error);
           alert('Failed to load data from Gist. Check console for details.');
       }
   }

   async function saveQuestionsToGist(questions) {
       try {
           const response = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
               method: 'PATCH',
               headers: {
                   'Authorization': `token ${GITHUB_TOKEN}`,
                   'Content-Type': 'application/json'
               },
               body: JSON.stringify({
                   files: {
                       [GIST_FILE]: {
                           content: JSON.stringify(questions, null, 2) // Pretty print JSON
                       }
                   }
               })
           });

           if (!response.ok) {
               throw new Error(`HTTP error! status: ${response.status}`);
           }

           console.log('Questions saved to Gist successfully!');
       } catch (error) {
           console.error('Error saving questions to Gist:', error);
           alert('Failed to save data to Gist. Check console for details.');
       }
   }
   