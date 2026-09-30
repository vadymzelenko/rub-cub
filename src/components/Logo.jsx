import { useState } from 'react';
import { FiBox } from 'react-icons/fi';

export default function Logo({ size = 100 }) {
    const [err, setErr] = useState(false);
    if (err) return <FiBox size={size} />;
    return (
        <img
            src="./logo.svg"
            alt="RubCub"
            width={size}
            height={size}
            style={{ objectFit: 'contain', display: 'block' }}
            onError={() => setErr(true)}
        />
    );
}