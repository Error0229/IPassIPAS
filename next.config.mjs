/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'img.yamol.tw',
          port: '',
          pathname: '/**',
        },
      ],
    },
  };
  
  export default nextConfig;
  