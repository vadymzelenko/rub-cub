import { useState } from 'react';
import { FiBox } from 'react-icons/fi';

export default function Logo({ size = 40 }) {
    const [err, setErr] = useState(false);
    if (err) return <FiBox size={size} />;
    return (
        <img
            src="./logo.png"
            alt="RubCub"
            width={size}
            height={size}
            style={{ objectFit: 'contain', display: 'block' }}
            onError={() => setErr(true)}
        />
    );
}