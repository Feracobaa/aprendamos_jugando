import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: [
        'localhost:4041', 
        'localhost:3000', 
        '*.ngrok-free.app', 
        '*.ngrok-free.dev', 
        '*.ngrok.io', 
        '*.ngrok.com'
      ]
    }
  }
};

export default nextConfig;
