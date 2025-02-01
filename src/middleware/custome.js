import useragent from 'useragent';

export default function userAgent(req, res, next){
    try{
        const agent = useragent.lookup(req.headers['user-agent']);
        req.uAgent = agent;
        next();
    }catch(e){
        console.error('Error parsing user-agent:', e);
        res.status(500).json({
            status: "failed",
            message: "Failed to parse user-agent",
        }); 
    }
};


