const express = require('express');
const router = express.Router();
const Candidate = require('../models/candidate');
const User = require('../models/user');
const { jwtAuthMiddleware, generateToken } = require('../jwt');

const checkAdminRole = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (user.role === 'admin') {
            return true;
        }
    } catch (err) {
        return false;
    }
}

// POST route to add candidate
router.post('/', jwtAuthMiddleware, async (req, res) => {
    try {
        if (! await checkAdminRole(req.user.id))
            return res.status(403).json({ message: 'User does not have admin role' });

        const data = req.body //assuming  the request body contains the candidate data 

        // create a new Candidate document using the Mongoose model
        const newCandidate = new Candidate(data);

        // save the new candidate to the database
        const response = await newCandidate.save();
        console.log("data saved.");

        res.status(200).json({ response: response });

    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.put('/:candidateId', jwtAuthMiddleware, async (req, res) => {
    try {
        if (!await checkAdminRole(req.user.id))
            return res.status(403).json({ message: 'User does not have admin role' });

        const candidateId = req.params.candidateId;    //Extract the id from the URL parameter
        const updatedCandidateData = req.body;   //updated data for person

        const response = await Candidate.findByIdAndUpdate(candidateId, updatedCandidateData, {
            new: true,
            runValidators: true,
        })

        if (!response) {
            return res.status(404).json({ error: 'Candidate not found' });
        }

        console.log('candidate data updated');
        res.status(200).json(response);

    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Internal server error' });
    }
})

router.delete('/:candidateId', jwtAuthMiddleware, async (req, res) => {
    try {
        if (!await checkAdminRole(req.user.id))
            return res.status(403).json({ message: 'User does not have admin role' });

        const candidateId = req.params.candidateId;    //Extract the id from the URL parameter

        const response = await Candidate.findByIdAndDelete(candidateId);

        if (!response) {
            return res.status(404).json({ error: 'Candidate not found' });
        }

        console.log('candidate deleted');
        res.status(200).json(response);

    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Internal server error' });
    }
})
// let's start vote
router.post('/vote/:candidateId', jwtAuthMiddleware, async (req, res) => {
    // no admin can vote
    // user can only vote once

    const candidateId = req.params.candidateId;
    const userId = req.user.id;
    try {
        //  find the candidate document with the specified candidateId
        const candidate = await Candidate.findById(candidateId);
        if (!candidate) {
            return res.status(404).json({ message: 'Candidate not found' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (user.isVoted) {
            return res.status(400).json({ message: 'User has already voted' });
        }
        if (user.role === 'admin') {
            return res.status(403).json({ message: 'Admin users cannot vote' });
        }

        // update the candidate document to record the vote
        candidate.votes.push({ user: userId });
        candidate.voteCount++;
        await candidate.save();

        // update the user document
        user.isVoted = true;
        await user.save();

        res.status(200).json({ message: 'Vote recorded successfully' });

    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Internal server error' });
    }
})

// vote count
router.get('/vote/count', async (req, res) => {
    try {
        // find all candidates and sort thembyvoyeCount in decending order
        const candidates = await Candidate.find().sort({ voteCount: 'desc' });

        // map the candidates to only return their name and vote count
        const voteRecord = candidates.map((data) => {
            return {
                party: data.party,
                voteCount: data.voteCount
            }
        })
        res.status(200).json(voteRecord);

    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Internal server error' });
    }
})

// Get List of all candidates with only name and party fields
router.get('/', async (req, res) => {
    try {
        // Find all candidates and select only the name and party fields, excluding _id
        const candidates = await Candidate.find({}, 'name party -_id');

        // Return the list of candidates
        res.status(200).json(candidates);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;