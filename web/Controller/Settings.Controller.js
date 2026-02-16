import Settings from "../Models/Settings.Model.js";

export const createSetting = async (req, res) => {
    try {

        const existing = await Settings.findOne();

        if (existing) {
            return res.status(400).json({
                success: false,
                message: "Settings already exist. Use update instead.",
                data: existing
            });
        }

        const settings = await Settings.create(req.body);

        return res.status(201).json({
            success: true,
            message: "Settings created successfully",
            data: settings
        });

    } catch (error) {

        console.error("Create Setting Error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });

    }
};

export const getSetting = async (req, res) => {
    try {

        const settings = await Settings.findOne();

        if (!settings) {
            return res.status(200).json({
                success: true,
                data: null
            });
        }

        return res.status(200).json({
            success: true,
            data: settings
        });

    } catch (error) {

        console.log(error, "<<<< error")

        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });

    }
}

export const updateColor = async (req, res) => {

    try {

        let settings = await Settings.findOne();

        // create if not exists
        if (!settings) {

            settings = await Settings.create(req.body);

        } else {

            settings = await Settings.findByIdAndUpdate(

                settings._id,

                req.body,

                {
                    new: true,
                    runValidators: true
                }

            );

        }

        return res.status(200).json({

            success: true,

            message: "Settings updated successfully",

            data: settings

        });

    } catch (error) {

        console.error("Update Setting Error:", error);

        return res.status(500).json({

            success: false,

            message: "Internal Server Error"

        });

    }

};
