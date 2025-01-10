import userModel from "../models/Users.js";
import { findUserByUserName_WOC, updateUserByUsername_WC } from "../services/userServices.js";

export async function usersDetails(req, res) {
  try {
    const userData = await userModel.find().select('email role username -_id');
    console.log(userData);
    const count = await userModel.countDocuments({}, { hint: "_id_" });
    if (count === 0) return res.status(404).json({ message: 'no record found' });
    res.status(200).json([{
      totalusers: count,
      userdetails: userData
    }]);
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};
export async function userDetail(req, res) {
  const { username } = req.body;
  try {
    const data = await userModel.findOne({ username }).select('email role username -_id');
    if (!data) return res.status(404).json({ message: `${username} - no active record found` });
    return res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: `Server error ${error.message}` });
  };
};
export async function makeAdmin(req, res) {
  try {
    const { username } = req.params;
    const existingUser = await findUserByUserName_WOC(username);
    if (!existingUser) return res.status(404).json({ message: `${username} - no active record found` });
    if (existingUser.role !== 'admin') return res.status(409).json({ status: false });
    if (existingUser.deleted) return res.status(403).json({ message: `${username} - has been banned` });
    const updatedUser = await updateUserByUsername_WC({ username }, { role: "admin" });
    if (updatedUser) return res.status(200).json({ message: `user ${username} roled to admin` });
    return res.status(409).json({ status: true });
  } catch (error) {
    res.status(500).json({ message: `Server error ${error.message}` });
  }
}
export async function userBanstatus(req, res) {
  try {
    let updateddUser;
    let userDatas = [];
    const { username } = req.params;
    let { switch_status } = req.body;
    switch_status = Boolean(Number(switch_status));
    const existingUser = await findUserByUserName_WOC(username);
    function userCreate(retivedUserdata){
      let userData = {};
      userData["username"] = retivedUserdata['username'];
      userData['status_ban'] = retivedUserdata['deleted'];
      userDatas.push(userData);
    }
    if (!existingUser) return res.status(404).json({ message: `${username} - no active record found` })
    if (switch_status === existingUser.deleted) {
      userCreate(existingUser);
      return res.status(200).json(userDatas);
    };
    if (!existingUser.deleted === switch_status) {
      updateddUser = await updateUserByUsername_WC({ username, deleted: !switch_status }, { deleted: switch_status, ...(switch_status && { deletedtimestamp: new Date().toISOString() }) });
    }
    if (updateddUser.deleted === switch_status) {
      userCreate(updateddUser);
      return res.status(200).json(userDatas);
    };
    return res.status(404).json({ message: `error on status` });
  } catch (e) {
    return res.status(500).json({ message: 'Server error' + e.message });
  }
}
