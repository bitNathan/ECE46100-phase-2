import express from 'express';
import OpenAI from "openai";

const router = express.Router();

router.post('/recommend', async (req, res) => {
    const { description } = req.body;

    if (!description || typeof description !== 'string') {
        res.status(400).json({ message: 'Description is required and should be a string.' });
        return;
    }

    try {
        // Adjusted prompt for newline-separated, plain text output
        const prompt = `Given the following description of a software project, recommend the top-5 open-source NPM packages that could be most beneficial. 
                        Provide the response as a numbered list with each item on a new line. Do not use markdown or include formatting like **.

                        Description: ${description}`;

        // Call the OpenAI API
        const openai = new OpenAI();
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "user", content: prompt }
            ]
        });

        // Clean up the response to ensure newlines and remove bold markers
        let responseContent = completion.choices[0].message.content || 'Unable to Perform the Request';
        responseContent = responseContent.replace(/\*\*/g, '').trim();

        // Build the response object
        const response = {
            data: {
                prompt: prompt,
                recommendations: responseContent
            }
        };

        res.status(201).json(response);
    } catch (error: any) {
        console.error('Error in /recommend:', error);
        res.status(500).json({ message: 'An error occurred while fetching recommendations.' });
    }
});

export default router;
