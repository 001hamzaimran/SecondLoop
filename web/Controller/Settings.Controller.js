// routes/settings.js
import express from 'express';
import Settings from '../Models/Settings.Model.js';

const router = express.Router();


export const getSetting = async (req, res) => {
    try {
        let settings = await Settings.find({});
        if (!settings) {
            return res.status(404).json({ success: false, message: "Settings not found" })
        }
        return res.status(200).json({ success: true, data: settings })
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal Server Error" })
    }
}



// UPDATE settings
router.put('/', async (req, res) => {
    try {
        const data = req.body;
        let settings = await Settings.findOne();
        if (!settings) {
            settings = await Settings.create(data);
        } else {
            Object.assign(settings, data);
            await settings.save();
        }
        res.json(settings);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});


const updateColor = async (req, res) => {
    try {
        const data = req.body;
        let settings = await Settings.findOne();
        if (!settings) {
            settings = await Settings.create(data);
        } else {
            Object.assign(settings, data);
            await settings.save();
        }
        res.json({ success: ture, data: settings });
    } catch (error) {
        console.log(error, "<<< error")
        res.status(500).json({ success: false, message: "Internal Server Error" })
    }
}