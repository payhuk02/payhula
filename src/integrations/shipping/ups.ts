/**
 * UPS Shipping Integration
 * Service pour intégration API UPS
 */

import { logger } from '@/lib/logger';

export interface UPSRateRequest {
  from: {
    country: string;
    postalCode: string;
    city?: string;
    state?: string;
  };
  to: {
    country: string;
    postalCode: string;
    city?: string;
    state?: string;
  };
  weight: number;
  weightUnit: 'kg' | 'lb';
  dimensions?: {
    length: number;
    width: number;
    height: number;
    unit: 'cm' | 'in';
  };
  serviceType?: string;
}

export interface UPSRate {
  serviceType: string;
  serviceName: string;
  shippingCost: number;
  currency: string;
  estimatedDelivery: string;
  transitTime?: number; // en jours
}

export interface UPSLabelRequest {
  from: {
    name: string;
    company?: string;
    address: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
    phone?: string;
    email?: string;
  };
  to: {
    name: string;
    company?: string;
    address: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
    phone?: string;
    email?: string;
  };
  package: {
    weight: number;
    weightUnit: 'kg' | 'lb';
    dimensions?: {
      length: number;
      width: number;
      height: number;
      unit: 'cm' | 'in';
    };
    description?: string;
  };
  serviceType: string;
  reference?: string;
}

export interface UPSLabelResponse {
  labelNumber: string;
  trackingNumber: string;
  labelUrl: string;
  shippingCost: number;
  currency: string;
  estimatedDelivery: string;
}

class UPSService {
  private apiKey: string;
  private apiSecret: string;
  private accountNumber?: string;
  private testMode: boolean;
  private apiUrl: string;

  constructor(config: {
    apiKey: string;
    apiSecret: string;
    accountNumber?: string;
    testMode?: boolean;
  }) {
    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;
    this.accountNumber = config.accountNumber;
    this.testMode = config.testMode ?? false;
    this.apiUrl = this.testMode
      ? 'https://wwwcie.ups.com/api'
      : 'https://onlinetools.ups.com/api';
  }

  /**
   * Obtenir les tarifs de livraison
   */
  async getRates(request: UPSRateRequest): Promise<UPSRate[]> {
    try {
      if (this.testMode) {
        // Mode test - retourner des données mockées
        return [
          {
            serviceType: 'UPS_GROUND',
            serviceName: 'UPS Ground',
            shippingCost: 1500,
            currency: 'XOF',
            estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
            transitTime: 5,
          },
          {
            serviceType: 'UPS_EXPRESS',
            serviceName: 'UPS Express',
            shippingCost: 3500,
            currency: 'XOF',
            estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
            transitTime: 2,
          },
          {
            serviceType: 'UPS_EXPEDITED',
            serviceName: 'UPS Expedited',
            shippingCost: 2500,
            currency: 'XOF',
            estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            transitTime: 3,
          },
        ];
      }

      // Obtenir le token d'accès OAuth
      const accessToken = await this.getAccessToken();

      // Appel API UPS Rate
      const response = await fetch(`${this.apiUrl}/rating/v1/Rate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'transId': `rate_${Date.now()}`,
          'transactionSrc': 'Emarzona',
        },
        body: JSON.stringify({
          RateRequest: {
            Request: {
              RequestOption: 'Rate',
              TransactionReference: {
                CustomerContext: `Emarzona_${Date.now()}`,
              },
            },
            Shipment: {
              Shipper: {
                Name: 'Emarzona',
                ShipperNumber: this.accountNumber,
                Address: {
                  AddressLine: [''],
                  City: request.from.city || '',
                  StateProvinceCode: request.from.state || '',
                  PostalCode: request.from.postalCode,
                  CountryCode: request.from.country,
                },
              },
              ShipTo: {
                Name: '',
                Address: {
                  AddressLine: [''],
                  City: request.to.city || '',
                  StateProvinceCode: request.to.state || '',
                  PostalCode: request.to.postalCode,
                  CountryCode: request.to.country,
                },
              },
              ShipFrom: {
                Name: '',
                Address: {
                  AddressLine: [''],
                  City: request.from.city || '',
                  StateProvinceCode: request.from.state || '',
                  PostalCode: request.from.postalCode,
                  CountryCode: request.from.country,
                },
              },
              Package: {
                PackagingType: {
                  Code: '02', // Customer Supplied Package
                  Description: 'Package',
                },
                Dimensions: request.dimensions
                  ? {
                      UnitOfMeasurement: {
                        Code: request.dimensions.unit === 'cm' ? 'CM' : 'IN',
                        Description: request.dimensions.unit === 'cm' ? 'Centimeters' : 'Inches',
                      },
                      Length: request.dimensions.length.toString(),
                      Width: request.dimensions.width.toString(),
                      Height: request.dimensions.height.toString(),
                    }
                  : undefined,
                PackageWeight: {
                  UnitOfMeasurement: {
                    Code: request.weightUnit === 'kg' ? 'KGS' : 'LBS',
                    Description: request.weightUnit === 'kg' ? 'Kilograms' : 'Pounds',
                  },
                  Weight: request.weight.toString(),
                },
              },
            },
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`UPS API error: ${error.fault?.detail?.errors?.[0]?.message || response.statusText}`);
      }

      const data = await response.json();

      // Parser la réponse UPS
      const rates: UPSRate[] = data.RateResponse?.RatedShipment?.map((shipment: any) => ({
        serviceType: shipment.Service?.Code || '',
        serviceName: shipment.Service?.Description || '',
        shippingCost: parseFloat(shipment.TotalCharges?.MonetaryValue || '0') * 100, // Convertir en centimes
        currency: shipment.TotalCharges?.CurrencyCode || 'XOF',
        estimatedDelivery: shipment.GuaranteedDelivery?.Date || '',
        transitTime: shipment.GuaranteedDelivery?.BusinessDaysInTransit,
      })) || [];

      return rates;
    } catch (error) {
      logger.error('UPS getRates error', { error, request });
      throw error;
    }
  }

  /**
   * Générer une étiquette
   */
  async createLabel(request: UPSLabelRequest): Promise<UPSLabelResponse> {
    try {
      if (this.testMode) {
        return {
          labelNumber: `UPS-${Date.now()}`,
          trackingNumber: `1Z${Math.random().toString(36).substring(2, 15).toUpperCase()}`,
          labelUrl: 'https://example.com/label.pdf',
          shippingCost: 1500,
          currency: 'XOF',
          estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        };
      }

      const accessToken = await this.getAccessToken();

      // Appel API UPS Shipment
      const response = await fetch(`${this.apiUrl}/ship/v1/shipments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'transId': `ship_${Date.now()}`,
          'transactionSrc': 'Emarzona',
        },
        body: JSON.stringify({
          ShipmentRequest: {
            Request: {
              RequestOption: 'nonvalidate',
              TransactionReference: {
                CustomerContext: `Emarzona_${Date.now()}`,
              },
            },
            Shipment: {
              Description: request.package.description || 'Package',
              Shipper: {
                Name: request.from.name,
                AttentionName: request.from.name,
                TaxIdentificationNumber: '',
                Phone: {
                  Number: request.from.phone || '',
                },
                ShipperNumber: this.accountNumber,
                FaxNumber: '',
                Address: {
                  AddressLine: [request.from.address],
                  City: request.from.city,
                  StateProvinceCode: request.from.state || '',
                  PostalCode: request.from.postalCode,
                  CountryCode: request.from.country,
                },
              },
              ShipTo: {
                Name: request.to.name,
                AttentionName: request.to.name,
                Phone: {
                  Number: request.to.phone || '',
                },
                Address: {
                  AddressLine: [request.to.address],
                  City: request.to.city,
                  StateProvinceCode: request.to.state || '',
                  PostalCode: request.to.postalCode,
                  CountryCode: request.to.country,
                },
              },
              ShipFrom: {
                Name: request.from.name,
                AttentionName: request.from.name,
                Phone: {
                  Number: request.from.phone || '',
                },
                Address: {
                  AddressLine: [request.from.address],
                  City: request.from.city,
                  StateProvinceCode: request.from.state || '',
                  PostalCode: request.from.postalCode,
                  CountryCode: request.from.country,
                },
              },
              PaymentInformation: {
                ShipmentCharge: {
                  Type: '01', // Transportation
                  BillShipper: {
                    AccountNumber: this.accountNumber,
                  },
                },
              },
              Service: {
                Code: request.serviceType,
                Description: request.serviceType,
              },
              Package: {
                Description: request.package.description || 'Package',
                Packaging: {
                  Code: '02', // Customer Supplied Package
                  Description: 'Package',
                },
                Dimensions: request.package.dimensions
                  ? {
                      UnitOfMeasurement: {
                        Code: request.package.dimensions.unit === 'cm' ? 'CM' : 'IN',
                        Description: request.package.dimensions.unit === 'cm' ? 'Centimeters' : 'Inches',
                      },
                      Length: request.package.dimensions.length.toString(),
                      Width: request.package.dimensions.width.toString(),
                      Height: request.package.dimensions.height.toString(),
                    }
                  : undefined,
                PackageWeight: {
                  UnitOfMeasurement: {
                    Code: request.package.weightUnit === 'kg' ? 'KGS' : 'LBS',
                    Description: request.package.weightUnit === 'kg' ? 'Kilograms' : 'Pounds',
                  },
                  Weight: request.package.weight.toString(),
                },
              },
              ReferenceNumber: request.reference
                ? {
                    Code: 'PM', // Purchase Order Number
                    Value: request.reference,
                  }
                : undefined,
            },
            LabelSpecification: {
              LabelImageFormat: {
                Code: 'PDF',
                Description: 'PDF',
              },
              HTTPUserAgent: 'Emarzona',
            },
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`UPS API error: ${error.fault?.detail?.errors?.[0]?.message || response.statusText}`);
      }

      const data = await response.json();

      return {
        labelNumber: data.ShipmentResponse?.ShipmentResults?.ShipmentIdentificationNumber || '',
        trackingNumber: data.ShipmentResponse?.ShipmentResults?.PackageResults?.TrackingNumber || '',
        labelUrl: data.ShipmentResponse?.ShipmentResults?.PackageResults?.ShippingLabel?.GraphicImage || '',
        shippingCost: parseFloat(data.ShipmentResponse?.ShipmentResults?.ShipmentCharges?.TotalCharges?.MonetaryValue || '0') * 100,
        currency: data.ShipmentResponse?.ShipmentResults?.ShipmentCharges?.TotalCharges?.CurrencyCode || 'XOF',
        estimatedDelivery: data.ShipmentResponse?.ShipmentResults?.ShipmentCharges?.ServiceOptionsCharges?.EstimatedDeliveryDate || '',
      };
    } catch (error) {
      logger.error('UPS createLabel error', { error, request });
      throw error;
    }
  }

  /**
   * Obtenir le suivi d'un colis
   */
  async trackShipment(trackingNumber: string): Promise<any> {
    try {
      if (this.testMode) {
        return {
          trackingNumber,
          status: 'in_transit',
          currentLocation: 'Paris, France',
          estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          events: [
            {
              date: new Date().toISOString(),
              location: 'Paris, France',
              description: 'Package in transit',
            },
          ],
        };
      }

      const accessToken = await this.getAccessToken();

      const response = await fetch(`${this.apiUrl}/track/v1/details/${trackingNumber}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'transId': `track_${Date.now()}`,
          'transactionSrc': 'Emarzona',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`UPS API error: ${error.fault?.detail?.errors?.[0]?.message || response.statusText}`);
      }

      const data = await response.json();

      return {
        trackingNumber: data.TrackResponse?.Shipment?.InquiryNumber?.Value || trackingNumber,
        status: data.TrackResponse?.Shipment?.Package?.Activity?.[0]?.Status?.Description?.Code || 'unknown',
        currentLocation: data.TrackResponse?.Shipment?.Package?.Activity?.[0]?.Location?.Address?.City || '',
        estimatedDelivery: data.TrackResponse?.Shipment?.Package?.DeliveryDate || '',
        events: data.TrackResponse?.Shipment?.Package?.Activity?.map((activity: any) => ({
          date: activity.Date || '',
          location: activity.Location?.Address?.City || '',
          description: activity.Status?.Description || '',
        })) || [],
      };
    } catch (error) {
      logger.error('UPS trackShipment error', { error, trackingNumber });
      throw error;
    }
  }

  /**
   * Obtenir token d'accès (OAuth)
   */
  private async getAccessToken(): Promise<string> {
    if (this.testMode) {
      return 'mock_ups_token';
    }

    const response = await fetch(`${this.apiUrl}/oauth/v1/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.apiKey,
        client_secret: this.apiSecret,
      }).toString(),
    });

    if (!response.ok) {
      throw new Error(`UPS OAuth error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.access_token;
  }
}

export default UPSService;


