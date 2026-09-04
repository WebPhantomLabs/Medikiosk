from abc import ABC, abstractmethod

class TerminologyProvider(ABC):
    @abstractmethod
    def get_display_name(self, code: str, system: str = 'ayurveda') -> str | None:
        """Return human-readable name for a terminology code."""
        pass

class AyurvedaTerminologyProvider(TerminologyProvider):
    """Placeholder for verified Ayurveda terminology mappings.
    
    NOTE: Real terminology mappings must come from verified clinical sources.
    This provider contains only basic structural codes, NOT clinical mappings.
    """
    
    BASIC_TERMS = {
        'prakriti': 'Body Constitution (Prakriti)',
        'vata': 'Vata Dosha',
        'pitta': 'Pitta Dosha', 
        'kapha': 'Kapha Dosha',
        'ashtavidha': 'Ashtavidha Pariksha (Eight-fold Examination)',
        'dashavidha': 'Dashavidha Pariksha (Ten-fold Examination)',
    }
    
    def get_display_name(self, code: str, system: str = 'ayurveda') -> str | None:
        if system != 'ayurveda':
            return None
        return self.BASIC_TERMS.get(code.lower())
